var connection = (function() {
	var unusedPlayerId = 0;
	var totalControllers = 0;
	var activePlayers = [];
	var serverPlayers = [];
	var connectedToServer = false;
	var playerOneUsingGamepad = false;
	var usedPlayers = [];
	var usedGamePads = [];
	var oldGamePadIds = [];

	function compare(a, b) {
		return a.filter(function(i) {
			return !contains(b, i);
		});
	}

	function onGamePadChange(gamepads) {
		//find which gamepads were added and which were removed
		var gamePadIds = [];
		for (var i = 0; i < gamepads.length; i++) {
			gamePadIds.push(gamepads[i].index);
		}
		var removed = compare(oldGamePadIds, gamePadIds);
		var added = compare(gamePadIds, oldGamePadIds);
		oldGamePadIds = gamePadIds;
		for (var i = 0; i < removed.length; i++) {
			onGamePadDisconnect(removed[i]); // pass the gamepad ID
		}
		for (var i = 0; i < added.length; i++) {
			onGamePadConnect(added[i]); // pass the gamepad ID
		}
	}

	function onGamePadConnect(gamePadId) {
		console.log("gamepad connected")
		totalControllers++;
		input.allowPlayerOneToSwitch(unusedControllers());
	}

	function onGamePadDisconnect(gamePadId) {
		console.log("gamepad disconnected")
		totalControllers--;
		if (gamePadInUse(gamePadId)) {
			// gamepad in use, disconnect that user.
			disconnectPlayer(gamePadId);
		}
		input.allowPlayerOneToSwitch(unusedControllers());
	}

	function gamePadInUse(gamePadId) {
		if (gamePadId === -1) {
			return true;
		}
		return contains(usedGamePads, gamePadId);
	}

	function disconnectPlayer(gamePadId) {
		if (findPlayerByGamePadId(gamePadId) === 0) {
			playerOneSwapInput();
			return false;
		}
		ui.remove(ui.getLocalPlayer(findPlayerByGamePadId(gamePadId)));
		recyclePlayer(gamePadId);
		if (gamePadInUse(gamePadId)) {
			removeFromArray(usedGamePads, gamePadId); // remove the gamepad id from used gamepads
		}
	}

	function connectPlayer(gamePadId) {
		if (typeof gamePadId === "undefined") {
			gamePadId = -1;
		}
		var player = Player(gamePadId);
		activePlayers.push(player);
		ui.addLocalPlayer(player.localId, gamePadId);
		if (!gamePadInUse(gamePadId)) {
			usedGamePads.push(gamePadId); // reserve this gamepad as used.
		}
		if (connectedToServer) {
			server.addPlayer(player.localId);
		}
	}

	function playerOneSwapInput() {
		if (activePlayers[0].gamePadId === -1) {
			// if player one isnt using a gamepad yet, lets find him one.
			for (var i = 0; i < gamePad.gamepads.length; i++) {
				if (!gamePadInUse(gamePad.gamepads[i].index)) {
					activePlayers[0].gamePadId = gamePad.gamepads[i].index;
					usedGamePads.push(gamePad.gamepads[i].index); // reserve this gamepad as used.
					connection.playerOneUsingGamepad = true;
					ui.changePlayer(ui.getLocalPlayer(activePlayers[0].localId), "controllerId", activePlayers[0].gamePadId);
					return true;
				}
			}
		} else {
			// reset back to keyboard
			if (gamePadInUse(activePlayers[0].gamePadId)) {
				removeFromArray(usedGamePads, activePlayers[0].gamePadId); // remove the gamepad id from used gamepads
			}
			activePlayers[0].gamePadId = -1;
			connection.playerOneUsingGamepad = false;
			ui.changePlayer(ui.getLocalPlayer(activePlayers[0].localId), "controllerId", activePlayers[0].gamePadId);
			return true;
		}
	}

	function onPlayerStart(gamePadId) {
		//player pressed start button on controller
		var playerId = findPlayerByGamePadId(gamePadId);
		if (playerId !== false) {
			// this player is already connected, disconnect them
			disconnectPlayer(gamePadId);
		}
		if (playerId === false) {
			// no players are using this gamepad, add a new player
			connectPlayer(gamePadId);
		}
		input.allowPlayerOneToSwitch(unusedControllers());
	}

	function findPlayerByGamePadId(gamePadId) {
		for (var i = 0; i < activePlayers.length; i++) {
			if (activePlayers[i].gamePadId === gamePadId) {
				return activePlayers[i].localId;
			}
		}
		return false;
	}

	function remotePlayerIsLocal(remoteId) {
		for (var i = 0; i < activePlayers.length; i++) {
			if (activePlayers[i].remoteId === remoteId) {
				return true;
			}
		}
		return false;
	}

	function findPlayerByLocalId(localId) {
		for (var i = 0; i < activePlayers.length; i++) {
			if (activePlayers[i].localId === localId) {
				return activePlayers[i];
			}
		}
		return false;
	}

	function Player(gamePadId) {
		var player;
		if (usedPlayers.length) {
			player = removeFromArray(usedPlayers); // get a used player and init them.
		} else {
			player = {};
		}
		if (typeof gamePadId === "undefined") {
			gamePadId = -1;
		}
		player.gamePadId = gamePadId;
		player.remoteId = -1;
		player.ping = 0;
		player.localId = unusedPlayerId;
		unusedPlayerId++;
		return player;
	}

	function recyclePlayer(gamePadId) {
		for (var i = 0; i < activePlayers.length; i++) {
			if (activePlayers[i].gamePadId === gamePadId) {
				usedPlayers.push(removeFromArrayAtIndex(activePlayers, i));
				return true;
			}
		}
	}

	function unusedControllers() {
		if (gamePad.gamepads.length > 0 && gamePad.gamepads.length > usedGamePads.length) {
			return true;
		}
		return false;
	}

	function init() {
		input.allowPlayerOneToSwitch(unusedControllers());
		connectPlayer(); // get player one
	}

	function joinServer() {
		connectedToServer = true;
		for (var i = 0; i < activePlayers.length; i++) {
			console.log("adding player", activePlayers[i])
			server.addPlayer(activePlayers[i].localId);
		}
	}

	function forEach(fn) {
		for (var i = 0; i < activePlayers.length; i++) {
			fn(activePlayers[i], i, activePlayers);
		}
	}
	return {
		init: init,
		onGamePadChange: onGamePadChange,
		onPlayerStart: onPlayerStart,
		playerOneUsingGamepad: playerOneUsingGamepad,
		findPlayerByLocalId: findPlayerByLocalId,
		playerOneSwapInput: playerOneSwapInput,
		remotePlayerIsLocal: remotePlayerIsLocal,
		forEach: forEach,
		get connectedToServer() {
			return connectedToServer;
		},
		joinServer: joinServer
	};
}());