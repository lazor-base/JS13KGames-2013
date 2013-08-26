var server = (function(document) {
	var socket;
	var fns = [];
	var scripts = ["/socket.io/socket.io.js", "/animationLoop.js", "/helper.js", "/tanks.js", "/commands.js"];
	var scriptIds = ["server", "animationLoop", "helper", "tanks", "commands"]
	var ready = 0;
	var serverReady = false;
	var serverElement;
	ui.ready(function() {
		serverElement = ui.get("server");
	});

	function connect(ip) {
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

	function getReady() {
		ready++;
		triggerReady();
	}

	function serverLoad() {
		ui.setAttribute(serverElement, "style", "border:1px solid green;background:rgba(0,255,0,0.1)");
		socket = io.connect(serverElement.value);
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
			ui.changePlayer(ui.getRemotePlayer(command.remoteId), "ping", command.ping);
			commands.push(command)
		});
		socket.on("replaceTank", function(tank, timeStamp) {
			socket.emit("pong", timeStamp);
			ui.changePlayer(ui.getRemotePlayer(tank.remoteId), ["x", tank.x,"y", tank.y]);
			tanks.replace(tank)
		});
		socket.on("pong", changePing);

		socket.on('disconnects', function(playerList, timeStamp) {
			socket.emit("pong", timeStamp);
			console.log("Removing", playerList.length, "players")
			tanks.remove(playerList);
			for (var i = 0; i < playerList.length; i++) {
				ui.remove(ui.getRemotePlayer(playerList[i]));
			}
		});
		connection.joinServer();
		getReady();
	}

	function changePing(timeStamp) {
		var ping = Date.now() - timeStamp;
		connection.forEach(function(player, index, activePlayers) {
			player.ping = ping;
			ui.changePlayer(ui.getRemotePlayer(player.remoteId), "ping", ping);
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
		if (ready === scripts.length) {
			for (var i = 0; i < fns.length; i++) {
				fns[i]();
			}
		}
	}

	function input(data) {
		socket.emit("input", data, Date.now());
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
		input: input
	};
}(document));