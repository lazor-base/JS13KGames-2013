var url = require('url');
var path = require('path');
var app = require('http').createServer(handler);
var io = require('socket.io').listen(app);
var fs = require('fs');
var animationLoop = require("./animationLoop.js");
var tanks = require("./tanks.js");
var helper = require("./helper.js");
global.contains = helper.contains;
global.removeFromArray = helper.removeFromArray;
global.removeFromArrayAtIndex = helper.removeFromArrayAtIndex;
global.randomFromInterval = helper.randomFromInterval;
process.on("uncaughtException", function(err) {
	console.error(err.message, err.stack);
});
var mimeTypes = {
	"html": "text/html",
	"jpeg": "image/jpeg",
	"jpg": "image/jpeg",
	"png": "image/png",
	"js": "text/javascript",
	"css": "text/css"
};
io.set('log level', 1); // reduce logging

app.listen(80, "0.0.0.0");

function handler(req, res) {
	var uri = url.parse(req.url).pathname;
	var filename = path.join(process.cwd(), uri);
	fs.exists(filename, function(exists) {
		if (!exists) {
			console.log("not exists: " + filename);
			res.writeHead(404, {
				'Content-Type': 'text/plain'
			});
			// res.write('404 Not Found\n');
			res.end();
			return;
		}
		var mimeType = mimeTypes[path.extname(filename).split(".")[1]];
		res.writeHead(200, {
			'Content-Type': mimeType
		});

		var fileStream = fs.createReadStream(filename);
		fileStream.pipe(res);

	});
}



var minId = 0;
var sockets = [];

io.sockets.on('connection', function(socket) {
	console.log("player connected");
	sockets.push(socket);
	socket.set("socketId", socket.id);
	socket.set("clientList", []);
	socket.set("players", 0);
	// remove below
	socket.emit("ping", Date.now());
	socket.on("pong", function(time) {
		socket.set("ping", Date.now() - time);
	});
	// remove above
	if (tanks.length) {
		// send all player data to this new player
		socket.emit("gamePlayers", tanks.tankList, Date.now());
	}
	socket.on("pong", function(timeStamp) {
		tanks.forEach(function(tank, index, tankList) {
			if (tank.socketId === socket.id) {
				tank.ping = Date.now() - timeStamp;
			}
		});
	});
	socket.on("disconnectUser", function(remoteId, timeStamp) {
		socket.emit("pong", timeStamp);
		removePlayerById([remoteId], socket)
	});
	socket.on("addUser", function(data, timeStamp) { // adding a user from an already connected local machine.
		socket.emit("pong", timeStamp);
		console.log("adduser");
		var remoteId = minId;
		minId = minId + 1; // make sure the relevant number of ids are reserved.
		data.remoteId = remoteId;
		socket.emit("userAdded", data, timeStamp);
		socket.get("players", function(err, number) {
			socket.set("players", number + 1);
		});
		socket.get("clientList", function(err, idList) {
			idList.push(remoteId);
			socket.set("clientList", idList);
			console.log("new player, id", remoteId);
			socket.get("ping", function(err, ping) {
				var newPlayerData = tanks.create(remoteId, socket.id, ping);
				tanks.add([newPlayerData]);
				console.log(newPlayerData)
				// broadcast the new players to all players
				io.sockets.emit("gamePlayers", [newPlayerData], Date.now());
				console.log("total players", tanks.length)
			});
		});
	});
	socket.on("input", function(moveMentData, timeStamp) {
		socket.emit("pong", timeStamp);
		var player = tanks.getTankById(moveMentData.remoteId);
		player.xSpeed = moveMentData.xSpeed;
		player.ySpeed = moveMentData.ySpeed;
		socket.get("ping", function(err, ping) {
			player.ping = ping;
			io.sockets.emit("updatePlayer", player, Date.now());
		});
	});
	socket.on("disconnect", function() {
		onPlayerDisconnect(socket);
	});
});

function removePlayerById(playerIds, socket) {
	io.sockets.emit("disconnects", playerIds, Date.now());
	tanks.remove(playerIds, function(remoteId) {
		socket.get("clientList", function(err, idList) {
			if (idList && idList.length) {
				global.removeFromArray(idList, remoteId);
				socket.set("clientList", idList);
			}
		});
	});
	console.log("total players", tanks.length);
}

function onPlayerDisconnect(socket) {
	console.log("Client Disconnected")
	socket.get("clientList", function(err, playerIds) {
		console.log(playerIds)
		removePlayerById(playerIds, socket);
		socket.get("socketId", function(err, index) {
			global.removeFromArrayAtIndex(sockets, index);
		});
	});
}

// remove below

function ping() {
	io.sockets.emit("ping", Date.now());
}
// remove above

animationLoop.setSpeed(50);
animationLoop.addToLoop(tanks.move);
animationLoop.startLoop();