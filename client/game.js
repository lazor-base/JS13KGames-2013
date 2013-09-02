var game = (function() {
	var motion = {};

	function makeMotionObject(id) {
		motion[id] = motion[id] || {
			remoteId: -1,
			xSpeed: 0,
			ySpeed: 0,
			timeStamp: time.now()
		};
	}
	makeMotionObject(-1);
	makeMotionObject("old");
	var gamePadMovement = {
		remoteId: -1,
		xSpeed: 0,
		ySpeed: 0,

		timeStamp: time.now()
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
		// gamePad.listenForChanges(function(gamepad) {
		// 	makeMotionObject(gamepad.index);
		// 	movement[gamepad.index].xSpeed = +gamepad.axes[gamePad.AXES.LEFT_HORIZONTAL].toFixed(4);
		// 	movement[gamepad.index].ySpeed = +gamepad.axes[gamePad.AXES.LEFT_VERTICAL].toFixed(4);

		// 	if (connection.connectedToServer) {
		// 		var player = connection.findPlayerByGamePadId(gamepad.index);
		// 		movement[gamepad.index].remoteId = player.remoteId;
		// 		movement[gamepad.index].timeStamp = time.now();
		// 		server.input(movement[gamepad.index]);
		// 	}
		// });
		config.init(-1, "keyboard"); // init player 0 keyboard
		config.init(-2, "mouse"); // init player 0 mouse
		// bind keylistener and mouse listener to the page
		document.addEventListener("keydown", controls.keyPress);
		document.addEventListener("keyup", controls.keyRelease);
		document.addEventListener("mousedown", controls.mouseDown);
		document.addEventListener("mouseup", controls.mouseUp);
		// document.addEventListener("mousemove", controls.mouseMove);
		gamePad.listenForChanges(controls.gamepad);
		controls.onChange(function(localId, action, value, controller) {
			if (action === "shoot") {
				server.send("shoot", value, connection.findPlayerByLocalId(localId).remoteId);
			}
			if (action === "turretLeft") {
				server.send("turretLeft", value, connection.findPlayerByLocalId(localId).remoteId);
			}
			if (action === "turretRight") {
				server.send("turretRight", value, connection.findPlayerByLocalId(localId).remoteId);
			}
			if (action === "left") {
				server.send("left", value, connection.findPlayerByLocalId(localId).remoteId);
			}
			if (action === "right") {
				server.send("right", value, connection.findPlayerByLocalId(localId).remoteId);
			}
			if (action === "accel") {
				server.send("accel", value, connection.findPlayerByLocalId(localId).remoteId);
			}
			if (action === "decel") {
				server.send("decel", value, connection.findPlayerByLocalId(localId).remoteId);
			}
		});

		// input.onMouse(function(event) {
		// 	server.send("shoot")
		// 	server.click(mouse, connection.findPlayerByLocalId(0).remoteId);
		// });

		// input.onKeyRelease(function(event) {
		// 	if (helper.contains(keyCodes, event.keyCode)) {
		// 		helper.removeFromArray(moveMent, codeName(event.keyCode));
		// 		handleChange();
		// 	}
		// });
		// input.onKeyPress(function(event) {
		// 	if (helper.contains(keyCodes, event.keyCode)) {
		// 		var code = codeName(event.keyCode);
		// 		if (!helper.contains(moveMent, code)) {
		// 			moveMent.push(code);
		// 			handleChange();
		// 		}
		// 	}
		// });
		commands.onExecute(tanks.execute);

		animationLoop.every(0, function() {
			// if (input.pause) {
			// 	moveMent = [];
			// 	handleChange();
			// }
			tanks.forEach(function(tank, index, tankList) {
				ui.changePlayer(ui.getRemotePlayer(tank.remoteId), ["x", tank.x, "y", tank.y]);
			});
		});
		animationLoop.every(0, commands.process);
		animationLoop.every(0, draw.clearCanvas);
		animationLoop.every(0, tanks.move);
		animationLoop.every(0, drawEntity);
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
		motion[-1].ySpeed = 0;
		motion[-1].xSpeed = 0;
		if (input.pause === false) {
			for (var i = 0; i < moveMent.length; i++) {
				var code = moveMent[i];
				if (helper.contains(vertical, code) && !y) {
					y = true;
					motion[-1].ySpeed = values[code];
				}
				if (helper.contains(horizontal, code) && !x) {
					x = true;
					motion[-1].xSpeed = values[code];
				}
			}
		} else {
			moveMent = [];
		}
		if (connection.connectedToServer && isDifferent(motion["old"], motion[-1])) {
			var player = connection.findPlayerByLocalId(0);
			motion[-1].remoteId = player.remoteId;
			motion[-1].timeStamp = time.now();
			server.input(motion[-1]);
		}
	}

	function drawTanks(tank, index, tankList) {
		var home = connection.remotePlayerIsLocal(tank.remoteId);
		draw.dot(tank, home);
	}

	function drawEntity() {
		tanks.forEach(drawTanks);
		// add bullet code here too
		// add effects code here
	}
}());