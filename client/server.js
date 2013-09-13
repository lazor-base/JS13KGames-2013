var server = (function(document) {
	var socket;
	var readyFunctions = [];
	var scripts = ["/socket.io/socket.io.js", "/helper.js", "/messages.js", "/animationLoop.js", "/tanks.js", "/commands.js", "/bullets.js", "/physics.js", "/weapons.js", "/effects.js", "/map.js"];
	var scriptIds = ["server", "helper", "messages", "animationLoop", "tanks", "commands", "bullets", "physics", "weapons", "effects", "map"];
	var ready = 0;
	var serverReady = false;
	var currentServer = null;
	var serverElement;
	var lastPong = time.now();
	ui.ready(function() {
		serverElement = ui.get("server");
	});

	function connect(ip) {
		if (ip !== currentServer) {
			for (var i = 0; i < scripts.length; i++) {
				var id = scriptIds[i] + "Script";
				var scriptElement = ui.get(id);
				if (scriptElement) {
					ui.remove(scriptElement);
				}
				var script = ui.createElement("script");
				if (scriptIds[i] === "server") {
					script.onload = server.serverLoad;
				} else {
					script.onload = getReady;
				}
				script.onerror = server.serverFail;
				ui.setAttribute(script, ["id", id, "src", "http://" + ip + scripts[i]]);
				document.body.appendChild(script);
			}
		}
	}

	function getReady() {
		ready++;
		triggerReady();
	}

	function serverLoad() {
		ui.setAttribute(serverElement, "style", "border:1px solid green;background:rgba(0,255,0,0.1)");
		ui.get("score").setAttribute("src", "http://" + serverElement.value + "/score.html")
		onReady(function() {
			socket = io.connect(serverElement.value);
			socket.on("message", function(messageList, sendTime) {
				messages.parse(messageList, sendTime, socket);
			});
			socket.on("disconnect", function(messageList) {
				location.reload(); // fast way to clear everything if the server disconnects
			});
			socket.on("pong", function(localTime, difference, serverTime) {
				changePing(localTime, difference, serverTime);
			});
			var clientTimestamp = (new Date()).valueOf();
			if (ui.get("name").value) {
				socket.emit("name", ui.get("name").value);
			}
			messages.newMessage("getServerTime", socket, clientTimestamp);
			// socket.emit("getServerTime", clientTimestamp);
			connection.joinServer();
		});
		getReady();
	}

	function changePing(localTime, difference, serverTime) {
		time.parse(localTime, difference, serverTime, function() {
			var ping = difference;
			connection.forEach(function(player, index, activePlayers) {
				player.ping = ping;
				ui.changePlayer(ui.getRemotePlayer(player.remoteId), "ping", ping);
			});
		});
	}

	function onReady(fn) {
		if (ready !== scripts.length) {
			readyFunctions.push(fn);
		} else {
			fn();
		}
	}

	function triggerReady() {
		serverReady = true;
		var inputs = document.querySelectorAll("input[data-ip]");
		for (var i = 0; i < inputs.length; i++) {
			inputs[i].disabled = true;
		}
		ui.get("server").disabled = true;
		if (ready === scripts.length) {
			for (var i = 0; i < readyFunctions.length; i++) {
				readyFunctions[i]();
			}
		}
	}

	function send(action, value, remoteId) {
		messages.newMessage("input", socket, action, value, remoteId);
		// socket.emit("input", action, value, remoteId, Date.now());
		if (action === "input") {
			messages.sendNow();
		}
	}

	function serverFail() {
		ready = false;
		ui.setAttribute(serverElement, "style", "border:1px solid red;background:rgba(255,0,0,0.1)");
	}

	function removePlayer(remoteId) {
		messages.newMessage("disconnectUser", socket, remoteId);
		// socket.emit("disconnectUser", remoteId, Date.now());
	}

	function addPlayer(localId) {
		messages.newMessage("addUser", socket, localId);
		// socket.emit("addUser", localId, Date.now());
	}

	function handle(name, data, sendTime, socket) {
		if (time.now() - lastPong >= 50) {
			lastPong = time.now();
			// messages.newMessage("pong", socket, timeStamp);
			socket.emit("pong", sendTime);
		}
		data.push(sendTime, socket);
		messages.use(fns[name], data);
	}
	var fns = {
		userAdded: function(localId, remoteId, timeStamp, socket) {
			// this is the one function that doesnt require a pong to know current ping.
			var player = connection.findPlayerByLocalId(localId);
			player.remoteId = remoteId;
			player.ping = Date.now() - timeStamp;
			if (ui.getRemotePlayer(remoteId)) {
				ui.remove(ui.getRemotePlayer(remoteId));
			}
			ui.changePlayer(ui.getLocalPlayer(player.localId), ["remoteId", remoteId, "ping", player.ping]);
		},
		sendServerTime: function(data, timeStamp, socket) {
			var nowTimeStamp = (new Date()).valueOf();
			var serverClientRequestDiffTime = data.diff;
			var serverTimestamp = data.serverTimestamp;
			var serverClientResponseDiffTime = nowTimeStamp - serverTimestamp;
			var responseTime = (serverClientRequestDiffTime - nowTimeStamp + clientTimestamp - serverClientResponseDiffTime) / 2;
			var syncedServerTime = new Date((new Date()).valueOf() + (serverClientResponseDiffTime - responseTime));
		},
		gamePlayers: function(playerList, timeStamp, socket) {
			console.log("Adding", playerList.length, "players");
			tanks.add(playerList, function(tank) {
				ui.addRemotePlayer(tank.remoteId, tank.ping);
			});
		},
		syncMap: function(mapData) {
			map.buildWalls(mapData)
		},
		newPlayer: function(remoteId, socketId, ping, x, y, angle, turretAngle, weaponName, timeStamp, socket) {
			console.log("Adding 1 player");
			tanks.add(tanks.create(remoteId, socketId, ping, x, y, angle, turretAngle, weaponName), function(tank) {
				ui.addRemotePlayer(tank.remoteId, tank.ping);
			});
		},
		newCommand: function(remoteId, ping, actionTime, action, value, timeStamp, socket) {
			var command = commands.newCommand(remoteId, ping, actionTime, action, value);
			command.ping = command.ping || connection.findPlayerByLocalId(0).ping;
			ui.changePlayer(ui.getRemotePlayer(command.remoteId), "ping", command.ping);
			commands.push(command);
		},
		disconnects: function(playerList, timeStamp, socket) {
			console.log("Removing", playerList.length, "players")
			tanks.remove(playerList, function(remoteId) {
				ui.remove(ui.getRemotePlayer(remoteId));
			});
		},
		replaceTank: function(remoteId, property, value, health, timeStamp, socket) {
			tanks.replace(remoteId, property, value, health);
		},
	};
	return {
		get serverReady() {
			return serverReady;
		},
		connect: connect,
		removePlayer: removePlayer,
		addPlayer: addPlayer,
		serverLoad: serverLoad,
		serverFail: serverFail,
		onReady: onReady,
		handle: handle,
		send: send
	};
}(document));