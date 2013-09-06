var controls = (function() {
	var actions = ["shoot", "left", "right", "accel", "decel", "turretLeft", "turretRight", "localId"];
	var players = {};
	var changeListeners = [];

	function Player() {
		for (var i = 0; i < actions.length; i++) {
			this[actions[i]] = 0;
		}
		return this;
	}

	function keyPress(event) {
		changeKey(event, event.keyCode, -1, 1);
	}

	function keyRelease(event) {
		changeKey(event, event.keyCode, -1, 0);
	}

	function mouseDown(event) {
		changeKey(event, event.button, -2, 1);
	}

	function mouseUp(event) {
		changeKey(event, event.button, -2, 0);
	}

	function mouseMove(event) {
		if (event.target.nodeName === "CANVAS" && !connection.playerOneUsingGamepad) {
			if (event.offsetX || event.offsetX == 0) { //for webkit browser like safari and chrome
				mouse.x = event.offsetX;
				mouse.y = event.offsetY;
			} else if (event.layerX || event.layerX == 0) { // for mozilla firefox
				mouse.x = event.layerX;
				mouse.y = event.layerY;
			}
			var tank = tanks.getTankById(connection.findPlayerByLocalId(0).remoteId);
			players[-1] = players[-1] || new Player();
			players[-1].angle = angle(mouse.x, mouse.y, tank);
			change(players[-1].localId, "angle", players[-1].angle, players[-1]);
		}
	}

	function angle(x, y, tank) {
		return Math.atan2((y - tank.y), (x - tank.x)) /* * (180 / Math.PI)*/
		;
	}

	function gamepad(gamepad) {

		function compare(source, result) {
			if ((source < 0 && result === -1) || (source > 0 && result === 1)) {
				return source;
			}
			return 0;
		}

		function different(hardwareId, action, newValue) {
			if (players[hardwareId][action] !== Math.abs(newValue)) {
				players[hardwareId][action] = Math.abs(newValue);
				change(players[hardwareId].localId, action, players[hardwareId][action]);
			}
		}
		var hardwareId = gamepad.index;
		var tank = tanks.getTankById(connection.findPlayerByGamePadId(hardwareId).remoteId);
		if (tank) {
			players[hardwareId] = players[hardwareId] || new Player();
			for (var i = 0; i < gamepad.buttons.length; i++) {
				changeKey({}, i, hardwareId, gamepad.buttons[i]);
			}
			players[hardwareId].localId = connection.findPlayerByGamePadId(hardwareId).localId;
			// for the hardcoded analogue sticks
			var minimumPercent = 35 / 100;
			// make all the analogue stick values
			if (gamepad.axes[0] < 0) {
				var left_horizontal = Math.ceil(gamepad.axes[0] - minimumPercent);
			} else {
				var left_horizontal = Math.floor(gamepad.axes[0] + minimumPercent);
			}
			if (gamepad.axes[1] < 0) {
				var left_vertical = Math.ceil(gamepad.axes[1] - minimumPercent);
			} else {
				var left_vertical = Math.floor(gamepad.axes[1] + minimumPercent);
			}
			if (gamepad.axes[2] < 0) {
				var right_horizontal = Math.ceil(gamepad.axes[2] - minimumPercent);
			} else {
				var right_horizontal = Math.floor(gamepad.axes[2] + minimumPercent);
			}
			if (gamepad.axes[3] < 0) {
				var right_vertical = Math.ceil(gamepad.axes[3] - minimumPercent);
			} else {
				var right_vertical = Math.floor(gamepad.axes[3] + minimumPercent);
			}
			different(hardwareId, "left", compare(left_horizontal, -1));
			different(hardwareId, "right", compare(left_horizontal, 1));
			different(hardwareId, "accel", compare(left_vertical, -1));
			different(hardwareId, "decel", compare(left_vertical, 1));
			different(hardwareId, "turretLeft", compare(right_horizontal, -1));
			different(hardwareId, "turretRight", compare(right_horizontal, 1));
			// different(hardwareId, "angle", angle(tank.x + Math.floor(right_horizontal * 1000), tank.y + Math.floor(right_vertical * 1000), tank));
		}
	}

	function changeKey(event, keyCode, hardwareId, value) {
		var action = config.matchKey(hardwareId, keyCode);
		if (action !== false) { // only proceed if this key is bound to an action
			if (typeof event.preventDefault !== "undefined") {
				event.preventDefault();
			}
			players[hardwareId] = players[hardwareId] || new Player();
			if (hardwareId < 0) { // a catch for player 0 using keyboard and mouse
				players[hardwareId].localId = 0;
				hardwareId = -1; // we want to make sure we map mouse movements to keyboard movements
				players[hardwareId] = players[hardwareId] || new Player();
			}
			if (players[hardwareId][action] !== value) { // we only want to submit a change if the value is different
				players[hardwareId][action] = value;
				change(players[hardwareId].localId, action, value, players[hardwareId]);
			}
		}
	}

	function change(localId, action, value, controller) {
		for (var i = 0; i < changeListeners.length; i++) {
			changeListeners[i](localId, action, value, controller);
		}
	}

	function onChange(fn) {
		changeListeners.push(fn);
	}

	return {
		keyPress: keyPress,
		keyRelease: keyRelease,
		mouseDown: mouseDown,
		mouseUp: mouseUp,
		onChange: onChange,
		mouseMove: mouseMove,
		gamepad: gamepad
	};
}());