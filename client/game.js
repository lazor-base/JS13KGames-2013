var game = (function() {
	var keyBoardMovement = {
		remoteId: -1,
		xSpeed: 0,
		ySpeed: 0
	};
	var oldKeyBoardMovement = {
		xSpeed: 0,
		ySpeed: 0
	};
	var values = {};
	var codes = {};
	var keyCodes = [87, 65, 83, 68];
	var vertical = ["UP", "DOWN"];
	var horizontal = ["LEFT", "RIGHT"];
	for (var i = 0; i < 2; i++) {
		var vert = vertical[i];
		var hor = horizontal[i];
		values[vert] = values[hor] = (i * 2) - 1;
		codes[vert] = keyCodes[i * 2];
		codes[hor] = keyCodes[(i * 2) + 1];
	}
	var moveMent = [];

	ui.ready(function() {
		gamePad.init();
		connection.init();
		input.gamepad();
	});

	server.onReady(function() {
		gamePad.listenForChanges(function(gamepad) {
			horizontalMove = +gamepad.axes[gamePad.AXES.LEFT_HORIZONTAL].toFixed(4);
			verticalMove = +gamepad.axes[gamePad.AXES.LEFT_VERTICAL].toFixed(4);
		});

		input.onKeyRelease(function(event) {
			if (contains(keyCodes, event.keyCode)) {
				removeFromArray(moveMent, codeName(event.keyCode));
				handleChange();
			}
		});
		input.onKeyPress(function(event) {
			if (contains(keyCodes, event.keyCode)) {
				var code = codeName(event.keyCode);
				if (!contains(moveMent, code)) {
					moveMent.push(code);
					handleChange();
				}
			}
		});
		animationLoop.addToLoop(draw.clearCanvas);
		animationLoop.addToLoop(tanks.move);
		animationLoop.addToLoop(drawEntity);
		animationLoop.startLoop();
	});

	function codeName(keyCode) {
		for (var attr in codes) {
			if (codes[attr] === keyCode) {
				return attr;
			}
		}
	}

	function isDifferent(oldData, newData) {
		var newMovement = false;
		var codes = ["xSpeed", "ySpeed"];
		for (var i = 0; i < 2; i++) {
			var code = codes[i];
			if (oldData[code] !== newData[code]) {
				oldData[code] = newData[code];
				newMovement = true;
			}
		}
		return newMovement;
	}

	function handleChange() {
		var x = false;
		var y = false;
		keyBoardMovement.ySpeed = 0;
		keyBoardMovement.xSpeed = 0;
		for (var i = 0; i < moveMent.length; i++) {
			var code = moveMent[i];
			if (contains(vertical, code) && !y) {
				y = true;
				keyBoardMovement.ySpeed = values[code];
			}
			if (contains(horizontal, code) && !x) {
				x = true;
				keyBoardMovement.xSpeed = values[code];
			}
		}
		if (connection.connectedToServer && isDifferent(oldKeyBoardMovement, keyBoardMovement)) {
			var player = connection.findPlayerByLocalId(0);
			keyBoardMovement.remoteId = player.remoteId;
			server.input(keyBoardMovement);
		}
	}

	function drawTanks(tank, index, tankList) {
		var home = connection.remotePlayerIsLocal(tank.id);
		draw.dot(tank.x, tank.y, home);
	}

	function drawEntity() {
		tanks.forEach(drawTanks);
		// add bullet code here too
		// add effects code here
	}
}());