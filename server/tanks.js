var tanks = (function() {
	"use strict";
	var usedPlayers = [];
	var tankList = [];
	var recycleTime = 250;
	var onHurtListeners = [];

	function add(newPlayers, callback) {
		if (Array.isArray(newPlayers)) {
			for (var i = 0; i < newPlayers.length; i++) {
				tankList.push(newPlayers[i]);
				if (typeof callback === "function") {
					callback(newPlayers[i]);
				}
			}
		} else {
			tankList.push(newPlayers);
			if (typeof callback === "function") {
				callback(newPlayers);
			}
		}
	}

	function replace(remoteId, property, value, health, score) {
		var tank = getTankById(remoteId);
		tank[property] = value;
		if (tank.health < health && health === 10) {
			if (typeof draw !== "undefined") {
				effects.deathEffect(tank);
			}
		}
		tank.health = health;
		tank.currentScore = score;
	}



	function onHurt(fn) {
		onHurtListeners.push(fn);
	}

	function hurt(source, target, result) {
		for (var i = 0; i < onHurtListeners.length; i++) {
			onHurtListeners[i](source, target, result);
		}
		syncTank(target, 0, "health", target.health);
	}

	function updateCounter(deltaTime) {
		forEach(function(tank, index, tankList) {
			tank.timer += deltaTime;
		});
	}

	function syncTank(tank, commandValue, property, value) {
		if (commandValue === 0) {
			messages.newMessage("replaceTank", io.sockets, tank.remoteId, property, value, tank.health, tank.currentScore, time.now());
			// io.sockets.emit("replaceTank", remoteId, tank.x, tank.y, tank.angle, tank.xSpeed, tank.ySpeed, tank.turretAccel, tank.turretAngle, tank.health, time.now());
		}
	}

	function execute(command, deltaTime, remainder) {
		var tank = getTankById(command.remoteId);
		tank.ping = command.ping;
		tank.remainder = remainder;
		tank.deltaTime = deltaTime;
		if (tank.spawned === false && command.action !== "spawn") {
			return false;
		}
		if (command.action === "shoot") {
			tank.shoot = command.value;
			if (tank.shoot === 0) { // reset the weapon recycle timer
				tank.timer = 0;
			}
		}
		if (command.action === "changeWeapon") {
			tank.weaponName = command.value;
		}
		if (command.action === "turretLeft") {
			tank.turretAccel = -Math.abs(command.value);
			syncTank(tank, command.value, "turretAngle", tank.turretAngle);
		}
		if (command.action === "turretRight") {
			tank.turretAccel = Math.abs(command.value);
			syncTank(tank, command.value, "turretAngle", tank.turretAngle);
		}
		if (command.action === "left") {
			tank.xSource = -Math.abs(command.value);
			syncTank(tank, command.value, "angle", tank.angle);
		}
		if (command.action === "right") {
			tank.xSource = Math.abs(command.value);
			syncTank(tank, command.value, "angle", tank.angle);
		}
		if (command.action === "accel") {
			tank.ySource = -Math.abs(command.value);
			syncTank(tank, command.value, "x", tank.x);
			syncTank(tank, command.value, "y", tank.y);
		}
		if (command.action === "spawn") {
			if ( !! Math.abs(command.value) && tank.spawning === false) {
				tank.spawning = true;
				effects.spawnEffect(tank);
			}
		}
		if (command.action === "decel") {
			tank.ySource = Math.abs(command.value);
			syncTank(tank, command.value, "x", tank.x);
			syncTank(tank, command.value, "y", tank.y);
		}
	}

	function death(tank, bullet) {
		if (tank.health <= 0) {
			tank = reset(tank, tank.ping);
			for (var attr in tank) {
				syncTank(tank, 0, attr, tank[attr]);
			}
		}
	}

	function reset(tank, ping, x, y, angle, turretAngle, weaponName) {
		if (!x && !y) {
			var emptyTile = map.emptyTile();
			var emptyX = emptyTile[0] * 50 + 25;
			var emptyY = emptyTile[1] * 50 + 25;
		}
		tank.x = x || helper.randomFromInterval(emptyX - 10, emptyX + 10);
		tank.y = y || helper.randomFromInterval(emptyY - 10, emptyY + 10);
		tank.angle = angle || helper.randomFromInterval(0, 359);
		tank.turretAngle = turretAngle || helper.randomFromInterval(0, 359);
		tank.weaponName = weaponName || weapons.randomWeapon();
		tank.health = tank.fullHealth;

		tank.spawned = false;
		tank.spawning = false;
		tank.lastX = tank.x;
		tank.lastY = tank.y;
		tank.lastAngle = tank.angle;
		tank.xSpeed = 0;
		tank.ySpeed = 0;
		tank.xSource = 0;
		tank.ySource = 0;
		tank.drivePower = 0;
		tank.turnPower = 0;
		tank.deltaTime = 0;
		tank.remainder = 0;
		tank.previousScore += tank.currentScore;
		tank.currentScore = 0;
		tank.deaths++;
		tank.timer = 0;
		tank.shoot = 0;
		tank.lastShot = 0;
		tank.ping = ping;

		tank.turretAccel = 0;
		tank.lastUpdate = time.now();

		tank.width = 20;
		tank.height = 10;
		if (!tank.points) { // old points are just objects of x and y, and there is no need to replace those
			tank.points = [];
		}
		return tank;
	}

	function create(remoteId, socketId, ping, x, y, angle, turretAngle, weaponName) {
		if (usedPlayers.length > 0) {
			var player = helper.removeFromArrayAtIndex(usedPlayers);
		} else {
			var player = {};
		}
		player.remoteId = remoteId;
		player.socketId = socketId;

		player.fullHealth = 10;
		player.currentScore = 0;
		player.previousScore = 0;
		player.deaths = -1;

		player = reset(player, ping, x, y, angle, turretAngle, weaponName);
		return player;
	}

	function remove(playerIds, callback) {
		var lastIndex = 0;
		while (playerIds.length && lastIndex < tankList.length) {
			if (helper.contains(playerIds, tankList[lastIndex].remoteId)) {
				var remoteId = tankList[lastIndex].remoteId;
				console.log("destroying player", tankList[lastIndex].remoteId);
				usedPlayers.push(helper.removeFromArrayAtIndex(tankList, lastIndex));
				helper.removeFromArray(playerIds, remoteId);
				if (typeof callback === "function") {
					callback(remoteId);
				}
			} else {
				lastIndex++;
			}
		}
	}

	function getTankById(remoteId) {
		for (var i = 0; i < tankList.length; i++) {
			if (tankList[i].remoteId === remoteId) {
				return tankList[i];
			}
		}
		return false;
	}

	function forEach(callback) {
		for (var i = 0; i < tankList.length; i++) {
			callback(tankList[i], i, tankList);
		}
	}

	function parse(deltaTime) {
		forEach(function(tank, index, tankList) {
			if (tank.spawned) {
				processMove(tank, deltaTime);
				processShoot(tank, deltaTime);
			}
		});
	}

	function length() {
		return tankList.length;
	}

	function processShoot(tank, deltaTime) {
		if (tank.timer > recycleTime) {
			if (tank.shoot === 1) {
				// tank.weaponName = "cannon"
				if (time.now() - tank.lastShot > bullets.reloadTime(tank.weaponName)) {
					tank.lastShot = time.now();
					bullets.create(tank);
				}
			}
		}
	}

	function processMove(tank, deltaTime) {
		// Constants, just random numbers
		if (tank.lastTime - tank.startTime > 1000) {
			tank.startTime = tank.lastTime;
		}
		var MAX_SPEED = 60 * ((deltaTime + tank.remainder) / 1000); // figure out how fast we need to go to match 4 pixels per second
		var MAX_TURN_RATE = 60 * ((deltaTime + tank.remainder) / 1000);
		tank.remainder = 0;

		// If neither are pressed
		if (tank.xSource === 0 && tank.ySource === 0) {
			tank.turnPower = 0;
			tank.drivePower = 0;
		}
		// If up is pressed, and can still accelerate
		if (tank.ySource < 0 && tank.xSource === 0) {
			tank.drivePower = 100;
			tank.turnPower = 0;
		}
		// If down is pressed, and can decellerate or accelerate in reverse
		if (tank.ySource > 0 && tank.xSource === 0) {
			tank.drivePower = -100;
			tank.turnPower = 0;
		}
		// if Right is held, and can still turn Right, thus negative
		if (tank.xSource > 0 && tank.ySource === 0) {
			tank.turnPower = 100;
			tank.drivePower = 0;
		}
		// if Left is held, and can still turn LEFT, thus positive
		if (tank.xSource < 0 && tank.ySource === 0) {
			tank.turnPower = -100;
			tank.drivePower = 0;
		}

		// if both are pressed, but not 100%
		if (Math.abs(tank.xSource) > 0 && Math.abs(tank.ySource) > 0) {
			tank.turnPower = 100 * tank.xSource;
			tank.drivePower = 100 * -tank.ySource;
		}
		// If both are pressed, put turn and power to 50%
		if (Math.abs(tank.xSource) === 1 && Math.abs(tank.ySource) === 1) {
			tank.turnPower = 50 * tank.xSource;
			tank.drivePower = 50 * -tank.ySource;
		}

		// Implimenting the various variables to alter the tank's everything
		var turnAngle = tank.angle + (tank.turnPower / 100) * MAX_TURN_RATE;
		var reverse = turnAngle;
		turnAngle = Math.abs(turnAngle) % 360;
		if (reverse < 0) {
			turnAngle = 360 - turnAngle;
		}
		tank.xSpeed = (tank.drivePower / 100) * MAX_SPEED * Math.cos(turnAngle * Math.PI / 180);
		tank.ySpeed = (tank.drivePower / 100) * MAX_SPEED * Math.sin(turnAngle * Math.PI / 180);
		tank.lastAngle = tank.angle;
		tank.angle = turnAngle;
		tank.lastX = tank.x;
		tank.lastY = tank.y;
		tank.x += tank.xSpeed;
		tank.y += tank.ySpeed;
		if (tank.x > 890) {
			tank.x = 890;
		}
		if (tank.x < 10) {
			tank.x = 10;
		}
		if (tank.y > 590) {
			tank.y = 590;
		}
		if (tank.y < 10) {
			tank.y = 10;
		}

		var turretAngle = tank.turretAngle + ((tank.turnPower / 100) + ((tank.turretAccel * 100) / 100)) * MAX_TURN_RATE;
		var reverse = turretAngle;
		turretAngle = Math.abs(turretAngle) % 360;
		if (reverse < 0) {
			turretAngle = 360 - turretAngle;
		}
		tank.turretAngle = turretAngle;
		if (lastLog !== tank.angle + tank.x + tank.y) {
			lastLog = tank.angle + tank.x + tank.y
		}
	}
	var lastLog = 0;

	return {
		get tankList() {
			return tankList;
		},
		add: add,
		get length() {
			return tankList.length;
		},
		create: create,
		parse: parse,
		hurt: hurt,
		getTankById: getTankById,
		updateCounter: updateCounter,
		execute: execute,
		replace: replace,
		forEach: forEach,
		onHurt: onHurt,
		syncTank: syncTank,
		death: death,
		remove: remove
	};
}());
if (typeof module !== "undefined") {
	module.exports = tanks;
}