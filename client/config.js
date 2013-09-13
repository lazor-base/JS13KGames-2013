var config = (function() {
	var hardware = {};
	var types = ["mouse", "keyboard", "gamepad"];
	var actions = ["shoot", "left", "right", "accel", "decel", "turretLeft", "turretRight", "spawn"];
	var defaults = [
		[1, 38, 5],
		[-1, 65, -1],
		[-1, 68, -1],
		[-1, 87, -1],
		[-1, 83, -1],
		[0, 37, -1],
		[2, 39, -1],
		[-1, 13, 0],
	];

	function init(hardwareId, type) {
		if (!hardware[hardwareId]) {
			hardware[hardwareId] = new Input(type);
		}
	}

	function Input(type) {
		var index = types.indexOf(type);
		for (var i = 0; i < actions.length; i++) {
			this[actions[i]] = defaults[i][index];
		}
		return this;
	}

	function setKey(type, input, keyId, hardwareId) {
		init(hardwareId, type);
		hardware[hardwareId][input] = keyId;
	}

	function getKey(hardwareId, type, action) {
		init(hardwareId, types[2]); // keyboard and mouse are hardcoded, so it can only be a gamepad
		return hardware[hardwareId][action];
	}

	function matchKey(hardwareId, keyCode) {
		init(hardwareId, types[2]); // keyboard and mouse are hardcoded, so it can only be a gamepad
		for (var action in hardware[hardwareId]) {
			if (hardware[hardwareId][action] === keyCode) {
				return action;
			}
		}
		return false;
	}
	return {
		init: init,
		setKey: setKey,
		getKey: getKey,
		matchKey: matchKey
	};
}());