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

	function execute(command) {
		var tank = getTankById(command.remoteId);
		tank.xSpeed = command.xSpeed;
		tank.ySpeed = command.ySpeed;
		tank.ping = command.ping;
	}

	function create(remoteId, socketId, ping) {
		if (usedPlayers.length > 0) {
			var recycledPlayer = helper.removeFromArrayAtIndex(usedPlayers);
			recycledPlayer.remoteId = remoteId;
			recycledPlayer.socketId = socketId;
			recycledPlayer.x = helper.randomFromInterval(0, 300);
			recycledPlayer.y = helper.randomFromInterval(0, 300);
			recycledPlayer.health = 1;
			recycledPlayer.angle = 0;
			recycledPlayer.xSpeed = 0;
			recycledPlayer.ySpeed = 0;
			recycledPlayer.ping = ping;
			return recycledPlayer;
		} else {
			return {
				remoteId: remoteId,
				socketId: socketId,
				x: helper.randomFromInterval(0, 300),
				y: helper.randomFromInterval(0, 300),
				health: 1,
				angle: 0,
				ySpeed: 0,
				xSpeed: 0,
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

	function processMove(tank, index, tankList) {
		tank.x += tank.xSpeed;
		tank.y += tank.ySpeed;
	}

	function move() {
		forEach(processMove);
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
		forEach: forEach,
		remove: remove
	};
}());
if (typeof module !== "undefined") {
	module.exports = tanks;
}