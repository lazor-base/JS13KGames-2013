var tanks = (function() {
	"use strict";
	var usedPlayers = [];
	var tankList = [];
	var recycleTime = 250;
	var onHurtListeners = [];

	function add(newPlayers, callback) {
		for (var i = 0; i < newPlayers.length; i++) {
			tankList.push(newPlayers[i]);
			if (typeof callback === "function") {
				callback(newPlayers[i]);
			}
		}
	}

	function replace(newTank) {
		forEach(function(tank, index, tankList) {
			if (tank.remoteId === newTank.remoteId) {
				tankList[index].x = newTank.x;
				tankList[index].y = newTank.y;
				tankList[index].angle = newTank.angle;
				tankList[index].xSpeed = newTank.xSpeed;
				tankList[index].ySpeed = newTank.ySpeed;
				tankList[index].turretAccel = newTank.turretAccel;
				tankList[index].turretAngle = newTank.turretAngle;
				tankList[index].health = newTank.health;
				// tankList[index] = newTank;
			}
		});
	}

	function onHurt(fn) {
		onHurtListeners.push(fn);
	}

	function hurt(source, target, result) {
		for (var i = 0; i < onHurtListeners.length; i++) {
			onHurtListeners[i](source, target, result);
		}
	}

	function updateCounter(deltaTime) {
		forEach(function(tank, index, tankList) {
			tank.timer += deltaTime;
		});
	}

	function execute(command, deltaTime, remainder) {
		var tank = getTankById(command.remoteId);
		tank.ping = command.ping;
		tank.remainder = remainder;
		tank.deltaTime = deltaTime;
		if (typeof command.shoot !== "undefined") {
			tank.shoot = command.shoot;
			if (tank.shoot === 0) { // reset the weapon recycle timer
				tank.timer = 0;
			}
		}
		if (typeof command.changeWeapon !== "undefined") {
			tank.weaponType = command.changeWeapon;
		}
		if (typeof command.turretLeft !== "undefined") {
			tank.turretAccel = -Math.abs(command.turretLeft);
		}
		if (typeof command.turretRight !== "undefined") {
			tank.turretAccel = Math.abs(command.turretRight);
		}
		if (typeof command.left !== "undefined") {
			tank.xSource = -Math.abs(command.left);
		}
		if (typeof command.right !== "undefined") {
			tank.xSource = Math.abs(command.right);
		}
		if (typeof command.accel !== "undefined") {
			tank.ySource = -Math.abs(command.accel);
		}
		if (typeof command.decel !== "undefined") {
			tank.ySource = Math.abs(command.decel);
		}
	}

	function create(remoteId, socketId, ping) {
		var weapons = bullets.weaponList;
		var index = helper.randomFromInterval(0, weapons.length - 1);
		if (usedPlayers.length > 0) {
			var player = helper.removeFromArrayAtIndex(usedPlayers);
		} else {
			var player = {};
		}
		player.remoteId = remoteId;
		player.socketId = socketId;
		// player.x = helper.randomFromInterval(100, 400);
		// player.y = helper.randomFromInterval(100, 400);
		player.x = 100;
		player.y = 100;
		player.health = 100;
		player.angle = 0;
		player.xSpeed = 0;
		player.ySpeed = 0;
		player.xSource = 0;
		player.ySource = 0;
		player.drivePower = 0;
		player.turnPower = 0;
		player.deltaTime = 0;
		player.remainder = 0;
		player.timer = 0;
		player.shoot = 0;
		player.lastShot = 0;
		player.ping = ping;
		player.turretAngle = 0;
		player.turretAccel = 0;
		player.weaponType = weapons[index];
		player.width = 20;
		player.height = 10;
		player.points = [];
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
			processMove(tank, deltaTime);
			processShoot(tank, deltaTime);
		});
	}

	function length() {
		return tankList.length;
	}

	function processShoot(tank, deltaTime) {
		if (tank.timer > recycleTime) {
			if (tank.shoot === 1) {
				tank.weaponType = "laser"
				if (time.now() - tank.lastShot > bullets.reloadTime(tank.weaponType)) {
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

		tank.angle = turnAngle;
		tank.x += tank.xSpeed;
		tank.y += tank.ySpeed;
		if (tank.x > 700) {

		}

		var turretAngle = tank.turretAngle + ((tank.turnPower / 100) + ((tank.turretAccel * 100) / 100)) * MAX_TURN_RATE;
		var reverse = turretAngle;
		turretAngle = Math.abs(turretAngle) % 360;
		if (reverse < 0) {
			turretAngle = 360 - turretAngle;
		}
		tank.turretAngle = turretAngle;
	}

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
		remove: remove
	};
}());
if (typeof module !== "undefined") {
	module.exports = tanks;
}