var game = (function() {
	var motion = {};

	function makeMotionObject(id) {
		if (!motion[id]) {
			motion[id] = {
				remoteId: -1,
				xSpeed: 0,
				ySpeed: 0,
				timeStamp: time.now()
			};
		}
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
	});

	server.onReady(function() {
		config.init(-1, "keyboard"); // init player 0 keyboard
		config.init(-2, "mouse"); // init player 0 mouse
		// bind keylistener and mouse listener to the page
		document.addEventListener("keydown", controls.keyPress);
		document.addEventListener("keyup", controls.keyRelease);
		document.addEventListener("mousedown", controls.mouseDown);
		document.addEventListener("mouseup", controls.mouseUp);
		gamePad.listenForChanges(controls.gamepad);
		controls.onChange(function(localId, action, value, controller) {
			var remoteId = connection.findPlayerByLocalId(localId).remoteId;
			var tank = tanks.getTankById(remoteId);
			if (action === "spawn") {
				server.send("spawn", value, connection.findPlayerByLocalId(localId).remoteId);
			}
			if (tank && tank.spawned === false) {
				return false;
			}
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

		commands.onExecute(tanks.execute);

		animationLoop.every(0, function() {
			tanks.forEach(function(tank, index, tankList) {
				ui.changePlayer(ui.getRemotePlayer(tank.remoteId), ["name", tank.socketId, "ping", tank.ping, "weapon", tank.weaponName, "health", tank.health, "points", tank.currentScore]);
			});
		});
		tanks.onHurt(bullets.collide);
		// tanks.onHurt(effects);
		animationLoop.every(0, draw.clearCanvas);
		animationLoop.every(0, commands.process);
		animationLoop.every(0, tanks.parse);
		animationLoop.every(0, bullets.parse);
		animationLoop.every(0, effects.processEffects);
		animationLoop.every(0, map.collide);
		animationLoop.every(0, tanks.updateCounter);
		animationLoop.every(50, messages.sendMessages);
		animationLoop.every(0, drawEntity);
		animationLoop.every(0, spawnWhenReady);
		// animationLoop.every(0, physics.render);
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
			var tank = tanks.getTankById(player.remoteId);
			if (tank && tank.spawned) {
				console.log(tank)
				server.input(motion[-1]);
			}
		}
	}

	function drawTanks(tank, index, tankList) {
		var home = connection.remotePlayerIsLocal(tank.remoteId);
		draw.dot(tank, home);
	}

	function drawBullets(bullet, index, bulletList) {
		draw.bullet(bullet);
	}

	function drawEffect(effect, index, effectList) {
		draw.effect(effect);
	}

	function spawnWhenReady() {
		var spawned = true;
		tanks.forEach(function(tank, index, tankList) {
			var home = connection.remotePlayerIsLocal(tank.remoteId);
			if (home) {
				if (spawned === true) {
					spawned = tank.spawned;
				}
			}
		});
		if (spawned) {
			ui.get("spawn").classList.add("hidden");
		} else {
			ui.get("spawn").classList.remove("hidden");
		}
	}

	function drawWall(wall, index, walls) {
		draw.wall(wall);
	}

	function drawEntity() {
		map.forEach(drawWall);
		tanks.forEach(drawTanks);
		bullets.forEach(drawBullets);
		effects.forEach(drawEffect);
		// add bullet code here too
		// add effects code here
	}
}());