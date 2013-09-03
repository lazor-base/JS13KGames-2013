var server = (function(document) {
	var socket;
	var fns = [];
	var scripts = ["/socket.io/socket.io.js", "/animationLoop.js", "/tanks.js", "/commands.js", "/bullets.js"];
	var scriptIds = ["server", "animationLoop", "tanks", "commands", "bullets"];
	var ready = 0;
	var serverReady = false;
	var currentServer = null;
	var serverElement;
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
				console.log("http://" + ip + scripts[i])
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
		socket = io.connect(serverElement.value);
		var clientTimestamp = (new Date()).valueOf();
		socket.emit("getServerTime", clientTimestamp);
		socket.on("sendServerTime", function(data) {
			var nowTimeStamp = (new Date()).valueOf();
			var serverClientRequestDiffTime = data.diff;
			var serverTimestamp = data.serverTimestamp;
			var serverClientResponseDiffTime = nowTimeStamp - serverTimestamp;
			var responseTime = (serverClientRequestDiffTime - nowTimeStamp + clientTimestamp - serverClientResponseDiffTime) / 2;
			var syncedServerTime = new Date((new Date()).valueOf() + (serverClientResponseDiffTime - responseTime));
		});
		socket.on('disconnect', function() {
			location.reload(); // fast way to clear everything if the server disconnects
		});
		socket.on("gamePlayers", function(playerList, timeStamp) {
			socket.emit("pong", timeStamp);
			console.log("Adding", playerList.length, "players")
			tanks.add(playerList, function(tank) {
				ui.addRemotePlayer(tank.remoteId, tank.ping);
			});
		});
		socket.on("newCommand", function(command, timeStamp) {
			socket.emit("pong", timeStamp);
			command.ping = command.ping || connection.findPlayerByLocalId(0).ping;
			ui.changePlayer(ui.getRemotePlayer(command.remoteId), "ping", command.ping);
			commands.push(command)
		});
		socket.on("replaceTank", function(tank, timeStamp) {
			socket.emit("pong", timeStamp);
			ui.changePlayer(ui.getRemotePlayer(tank.remoteId), ["x", tank.x, "y", tank.y]);
			tanks.replace(tank)
		});
		socket.on("pong", changePing);

		socket.on('disconnects', function(playerList, timeStamp) {
			socket.emit("pong", timeStamp);
			console.log("Removing", playerList.length, "players")
			tanks.remove(playerList, function(remoteId) {
				console.log(ui.getRemotePlayer(remoteId))
				ui.remove(ui.getRemotePlayer(remoteId));
			});
		});
		connection.joinServer();
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
			fns.push(fn);
		} else {
			fn();
		}
	}

	function triggerReady() {
		var inputs = document.querySelectorAll("input[data-ip]");
		for(var i=0;i<inputs.length;i++) {
			inputs[i].disabled = true;
		}
		ui.get("server").disabled = true;
		if (ready === scripts.length) {
			for (var i = 0; i < fns.length; i++) {
				fns[i]();
			}
		}
	}

	function send(action, value, remoteId) {
		socket.emit("input", action, value, remoteId, Date.now());
	}

	function serverFail() {
		ready = false;
		ui.setAttribute(serverElement, "style", "border:1px solid red;background:rgba(255,0,0,0.1)");
	}

	function removePlayer(remoteId) {
		socket.emit("disconnectUser", remoteId, Date.now());
	}

	function addPlayer(localId) {
		var data = {
			localId: localId
		};
		socket.emit("addUser", data, Date.now());
		socket.on("userAdded", function(data, timeStamp) { // this is the one function that doesnt require a pong to know current ping.
			socket.emit("pong", timeStamp);
			var player = connection.findPlayerByLocalId(data.localId);
			player.remoteId = data.remoteId;
			player.ping = Date.now() - timeStamp;
			ui.changePlayer(ui.getLocalPlayer(player.localId), ["remoteId", data.remoteId, "ping", player.ping]);
		});
	}
	return {
		connect: connect,
		removePlayer: removePlayer,
		addPlayer: addPlayer,
		serverLoad: serverLoad,
		serverFail: serverFail,
		onReady: onReady,
		send: send,
	};
}(document));