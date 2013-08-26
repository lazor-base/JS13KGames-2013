var tanks = (function() {
	var usedPlayers = [];
	var tankList = [];

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
				tankList[index] = newTank;
			}
		})
	}

	/*function execute(command) {
		var tank = getTankById(command.remoteId);
		tank.xSpeed = command.xSpeed;
		tank.ySpeed = command.ySpeed;
		tank.ping = command.ping;
	}*/

	function execute(command, deltaTime) {
		var tank = getTankById(command.remoteId);
		tank.ping = command.ping;
		tank.deltaTime = deltaTime;
		tank.xSource = command.xSpeed;
		tank.ySource = command.ySpeed;
	}

	function create(remoteId, socketId, ping) {
		if (usedPlayers.length > 0) {
			var recycledPlayer = helper.removeFromArrayAtIndex(usedPlayers);
			recycledPlayer.remoteId = remoteId;
			recycledPlayer.socketId = socketId;
			recycledPlayer.x = helper.randomFromInterval(100, 400);
			recycledPlayer.y = helper.randomFromInterval(100, 400);
			recycledPlayer.health = 1;
			recycledPlayer.angle = 0;
			recycledPlayer.xSpeed = 0;
			recycledPlayer.ySpeed = 0;
			recycledPlayer.xSource = 0;
			recycledPlayer.ySource = 0;
			recycledPlayer.drivePower = 0;
			recycledPlayer.turnPower = 0;
			recycledPlayer.deltaTime = 0;
			recycledPlayer.ping = ping;
			return recycledPlayer;
		} else {
			return {
				remoteId: remoteId,
				socketId: socketId,
				// x: helper.randomFromInterval(100, 400),
				// y: helper.randomFromInterval(100, 400),
				x: 100,
				y: 100,
				health: 1,
				angle: 0,
				ySpeed: 0,
				xSpeed: 0,
				ySource: 0,
				xSource: 0,
				drivePower: 0,
				turnPower: 0,
				deltaTime: 0,
				ping: ping
			};
		}
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
				lastIndex++
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

	function processMove(tank, deltaTime) {
		"use strict";
		// Constants, just random numbers
		if (tank.lastTime - tank.startTime > 1000) {
			tank.startTime = tank.lastTime;
		}
		var MAX_SPEED = 60 * (deltaTime / 1000); // figure out how fast we need to go to match 4 pixels per second
		var MAX_TURN_RATE = 60 * (deltaTime / 1000);

		// If neither are pressed
		if (tank.xSource == 0 && tank.ySource == 0) {
			tank.turnPower = 0;
			tank.drivePower = 0;
		}
		// If up is pressed, and can still accelerate
		if (tank.ySource < 0 && tank.xSource == 0) {
			tank.drivePower = 100;
			tank.turnPower = 0;
		}
		// If down is pressed, and can decellerate or accelerate in reverse
		if (tank.ySource > 0 && tank.xSource == 0) {
			tank.drivePower = -100;
			tank.turnPower = 0;
		}
		// if Right is held, and can still turn Right, thus negative
		if (tank.xSource > 0 && tank.ySource == 0) {
			tank.turnPower = 100;
			tank.drivePower = 0;
		}
		// if Left is held, and can still turn LEFT, thus positive
		if (tank.xSource < 0 && tank.ySource == 0) {
			tank.turnPower = -100;
			tank.drivePower = 0;
		}

		// If both are pressed, put turn and power to 50%
		if (tank.xSource != 0 && tank.ySource != 0) {
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
	}

	function move(deltaTime) {
		forEach(function(tank, index, tankList) {
			processMove(tank, deltaTime)
		});
	}

	function length() {
		return tankList.length;
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
		move: move,
		getTankById: getTankById,
		execute: execute,
		replace: replace,
		forEach: forEach,
		remove: remove
	};
}());
if (typeof module !== "undefined") {
	module.exports = tanks;
}