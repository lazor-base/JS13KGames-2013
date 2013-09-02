var gamePad = (function(window, navigator) {
	var disabled = false;
	var polling = false;
	var gamepads = [];
	var prevRawGamepadTypes = [];
	var prevTimestamps = [];
	var gamePadListeners = [];

	const BUTTONS = {
		CROSS: 0, // Face (main) buttons
		CIRCLE: 1,
		TRIANGLE: 2,
		SQUARE: 3,
		LEFT_BUTTON: 4, // Top shoulder buttons
		RIGHT_BUTTON: 5,
		LEFT_TRIGGER: 6, // Bottom shoulder buttons
		RIGHT_TRIGGER: 7,
		SELECT: 8,
		START: 9,
		LEFT_ANALOGUE_STICK: 10, // Analogue sticks (if depressible)
		RIGHT_ANALOGUE_STICK: 11,
		PAD_TOP: 12, // Directional (discrete) pad
		PAD_BOTTOM: 13,
		PAD_LEFT: 14,
		PAD_RIGHT: 15
	};

	const AXES = {
		LEFT_HORIZONTAL: 0,
		LEFT_VERTICAL: 1,
		RIGHT_HORIZONTAL: 2,
		RIGHT_VERTICAL: 3
	};

	function connectedGamepads() {
		return gamepads.length;
	}

	function startPolling() {
		if (!polling) {
			polling = true;
			poll();
		}
	}

	function stopPolling() {
		polling = false;
	}

	function poll() {
		pollStatus();
		continuePolling();
	}

	function continuePolling() {
		if (polling) {
			if (window.requestAnimationFrame) {
				window.requestAnimationFrame(poll);
			} else if (window.mozRequestAnimationFrame) {
				window.mozRequestAnimationFrame(poll);
			} else if (window.webkitRequestAnimationFrame) {
				window.webkitRequestAnimationFrame(poll);
			}
		}
	}

	function init() {
		// As of writing, it seems impossible to detect Gamepad API support
		// in Firefox, hence we need to hardcode it in the third clause.
		// (The preceding two clauses are for Chrome.)
		var gamepadSupportAvailable = !! navigator.webkitGetGamepads || !! navigator.webkitGamepads || (navigator.userAgent.indexOf('Firefox/') !== -1);

		if (!gamepadSupportAvailable) {
			// No gamepad api avilable, disable it so it doesnt get in the way.
			disabled = true;
		} else {
			// Firefox supports the connect/disconnect event, so we attach event
			// handlers to those.
			window.addEventListener('MozGamepadConnected',
			onGamepadConnect, false);
			window.addEventListener('MozGamepadDisconnected',
			onGamepadDisconnect, false);

			// Since Chrome only supports polling, we initiate polling loop straight
			// away. For Firefox, we will only do it if we get a connect event.
			if ( !! navigator.webkitGamepads || !! navigator.webkitGetGamepads) {
				startPolling();
			}
		}
	}

	function pollStatus() {
		pollGamepads();
		// the following is used to check if there has been a change to the button inputs in chrome.
		for (var i in gamepads) {
			var gamepad = gamepads[i];

			// Don’t do anything if the current timestamp is the same as previous
			// one, which means that the state of the gamepad hasn’t changed.
			// This is only supported by Chrome right now, so the first check
			// makes sure we’re not doing anything if the timestamps are empty
			// or undefined.
			if (gamepad.timestamp && (gamepad.timestamp === prevTimestamps[i])) {
				continue;
			}
			prevTimestamps[i] = gamepad.timestamp;

			updateListeners(i);
		}
	}

	function updateListeners(gamepadId) {
		for (var i = 0; i < gamePadListeners.length; i++) {
			gamePadListeners[i](gamepads[gamepadId]);
		}
	}

	function listenForChanges(fn) {
		gamePadListeners.push(fn);
	}

	function pollGamepads() {

		// Get the array of gamepads – the first method (function call)
		// is the most modern one, the second is there for compatibility with
		// slightly older versions of Chrome, but it shouldn’t be necessary
		// for long.
		var rawGamepads = (navigator.webkitGetGamepads && navigator.webkitGetGamepads()) || navigator.webkitGamepads;

		if (rawGamepads) {
			// We don’t want to use rawGamepads coming straight from the browser,
			// since it can have “holes” (e.g. if you plug two gamepads, and then
			// unplug the first one, the remaining one will be at index [1]).
			gamepads = [];

			// We only refresh the display when we detect some gamepads are new
			// or removed; we do it by comparing raw gamepad table entries to
			// “undefined.”
			var gamepadsChanged = false;

			for (var i = 0; i < rawGamepads.length; i++) {
				if (typeof rawGamepads[i] !== prevRawGamepadTypes[i]) {
					gamepadsChanged = true;
					prevRawGamepadTypes[i] = typeof rawGamepads[i];
				}

				if (rawGamepads[i]) {
					gamepads.push(rawGamepads[i]);
				}
			}

			// Ask the tester to refresh the visual representations of gamePad.gamepads
			// on the screen.
			if (gamepadsChanged) {
				connection.onGamePadChange(gamepads);
			}
		}
	}

	function onGamepadConnect(event) {
		// Add the new gamepad on the list of gamePad.gamepads to look after.
		gamepads.push(event.gamepad);

		// Start the polling loop to monitor button changes.
		startPolling();
	}

	function onGamepadDisconnect() {}
	return {
		get gamepads() {
			return gamepads;
		},
		get disabled() {
			return disabled;
		},
		get polling() {
			return polling;
		},
		prevRawGamepadTypes: prevRawGamepadTypes,
		connectedGamepads: connectedGamepads,
		startPolling: startPolling,
		stopPolling: stopPolling,
		poll: poll,
		continuePolling: continuePolling,
		init: init,
		pollStatus: pollStatus,
		updateListeners: updateListeners,
		listenForChanges: listenForChanges,
		pollGamepads: pollGamepads,
		onGamepadConnect: onGamepadConnect,
		onGamepadDisconnect: onGamepadDisconnect,
		BUTTONS: BUTTONS,
		AXES: AXES
	};
}(window, navigator));