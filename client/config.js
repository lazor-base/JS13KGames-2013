var config = (function() {
	var hardware = {};
	var types = ["mouse", "keyboard", "gamepad"];
	var actions = ["shoot", "left", "right", "accel", "decel", "turretLeft", "turretRight"];
	var defaults = [
		[1, 38, -1],
		[-1, 65, 14],
		[-1, 68, 15],
		[-1, 87, 12],
		[-1, 83, 13],
		[0, 37, -1],
		[2, 39, -1],
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