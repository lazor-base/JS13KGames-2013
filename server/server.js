process.on("uncaughtException", function(err) {
	console.error(err.message, err.stack);
});

var url = require('url');
var path = require('path');
var app = require('http').createServer(handler);
var io = global.io = require('socket.io').listen(app);
var fs = require('fs');

var time = global.time = {
	now: function() {
		return Date.now()
	},
	micro: (function() {
		var getNanoSeconds, hrtime, loadTime;

		if ((typeof performance !== "undefined" && performance !== null) && performance.now) {
			return function() {
				return performance.now();
			};
		} else if ((typeof process !== "undefined" && process !== null) && process.hrtime) {
			hrtime = process.hrtime;
			getNanoSeconds = function() {
				var hr;
				hr = hrtime();
				return hr[0] * 1e9 + hr[1];
			};
			loadTime = getNanoSeconds();
			return function() {
				return (getNanoSeconds() - loadTime) / 1e6;
			};
		} else if (Date.now) {
			loadTime = Date.now();
			return function() {
				return Date.now() - loadTime;
			};
		} else {
			loadTime = new Date().getTime();
			return function() {
				return new Date().getTime() - loadTime;
			};
		}
	}())
};
var lastPong = time.now();
var helper = global.helper = require("./helper.js");
var messages = global.messages = require("./messages.js");
var commands = global.commands = require("./commands.js");
var animationLoop = global.animationLoop = require("./animationLoop.js");
var physics = global.physics = require("./physics.js");
var score = global.score = require("./score.js");
var map = global.map = require("./map.js");
var weapons = global.weapons = require("./weapons.js");
var bullets = global.bullets = require("./bullets.js");
var effects = global.effects = require("./effects.js");
var tanks = global.tanks = require("./tanks.js");

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
			console.log("file doesn't exist: " + filename);
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
	socket.set("ping", 30)
	socket.on("name", function(name) {
		name.replace(/^[A-Za-z_][A-Za-z\d_]*$/g, '');
		socket.set("name", name);

	});

	if (tanks.length) {
		// send all player data to this new player
		messages.newMessage("gamePlayers", socket, tanks.tankList);
		// socket.emit("gamePlayers", tanks.tankList, time.now());
	}
	map.syncMap(socket);

	socket.on("message", function(messageList, sendTime) {
		messages.parse(messageList, sendTime, socket);
	});
	socket.on("disconnect", function() {
		onPlayerDisconnect(socket);
	});
	socket.on("pong", function(timeStamp) {
		socket.set("ping", time.now() - timeStamp);
		tanks.forEach(function(tank, index, tankList) {
			if (tank.socketId === socket.id) {
				tank.ping = time.now() - timeStamp;
			}
		});
	});

});

function removePlayerById(playerIds, socket) {
	messages.newMessage("disconnects", io.sockets, playerIds, time.now());
	// io.sockets.emit("disconnects", playerIds, time.now());
	tanks.remove(playerIds, function(remoteId) {
		socket.get("clientList", function(err, idList) {
			if (idList && idList.length) {
				// helper.removeFromArray(idList, remoteId);
				// socket.set("clientList", idList);
			}
		});
	});
	console.log("total players", tanks.length);
}

function onPlayerDisconnect(socket) {
	console.log("Client Disconnected")
	socket.get("clientList", function(err, playerIds) {
		removePlayerById(playerIds, socket);
		socket.get("socketId", function(err, index) {

			helper.removeFromArrayAtIndex(sockets, index);
		});
	});
}

var server = global.server = (function() {
	function handle(name, data, sendTime, socket) {
		data.push(sendTime, socket);
		if (time.now() - lastPong >= 50) {
			lastPong = time.now();
			socket.emit("pong", sendTime, time.now() - sendTime, time.now());
		}
		messages.use(fns[name], data);
	}
	var fns = {
		disconnectUser: function(remoteId, timeStamp, socket) {
			removePlayerById([remoteId], socket);
		},
		addUser: function(localId, timeStamp, socket) {
			var remoteId = minId;
			minId = minId + 1; // make sure the relevant number of ids are reserved.
			messages.newMessage("userAdded", socket, localId, remoteId);
			socket.get("clientList", function(err, idList) {
				idList.push(remoteId);
				socket.set("clientList", idList);
				console.log("new player, id", remoteId);
				socket.get("ping", function(err, ping) {
					socket.get("name", function(err, name) {
						socket.get("players", function(err, number) {
							socket.set("players", number + 1);
							console.log(name)
							var tank = tanks.create(remoteId, name + " (" + number + ")" || socket.id, ping);
							tanks.add(tank);
							messages.newMessage("newPlayer", io.sockets, remoteId, name + " (" + number + ")" || socket.id, ping, tank.x, tank.y, tank.angle, tank.turretAngle, tank.weaponName);
							console.log("total players", tanks.length)
						});
					});
				});
			});
		},
		input: function(action, value, remoteId, timeStamp, socket) {
			socket.get("ping", function(err, ping) {
				var command = commands.newCommand(remoteId, ping, time.now() + 50, action, value);
				messages.newMessage("newCommand", io.sockets, remoteId, ping, time.now() + 50, action, value);
				commands.push(command);
				messages.sendNow();
			});
		}
	};
	return {
		handle: handle
	};
}());

map.init();
score.loadFromDisk();
tanks.onHurt(score.modifyScore);
tanks.onHurt(bullets.hurt);
tanks.onHurt(bullets.collide);
commands.onExecute(tanks.execute);
animationLoop.every(0, commands.process);
animationLoop.every(0, tanks.parse);
animationLoop.every(0, bullets.parse);
animationLoop.every(0, effects.processEffects);
animationLoop.every(0, map.collide);
animationLoop.every(0, tanks.updateCounter);
animationLoop.every(50, messages.sendMessages);
animationLoop.every(5000, weapons.changeWeapon);
animationLoop.every(10000, score.saveToDisk);
animationLoop.startLoop();
// var lastTick = time.micro();

// 	function processGame() {
// 		commands.process(currentTick - thisListener.lastTick)
// 	}