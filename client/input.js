var mouse = {
	x: null,
	y: null
};
var input = (function(window, document) {
	var pause = true;

	function preventDefault(event) {
		if (typeof event.preventDefault !== "undefined") {
			event.preventDefault();
		}
	}

	function allowPlayerOneToSwitch(bool) {
		var gamePadCheck = document.getElementById("playerOneUseGamepad");
		if (connection.playerOneUsingGamepad === false) {
			if (bool) {
				connection.playerOneUsingGamepad = false;
				gamePadCheck.nextSibling.textContent = "Player One: Switch to Gamepad (Using keyboard)";
				gamePadCheck.disabled = false;
				gamePadCheck.checked = false;
			} else {
				gamePadCheck.nextSibling.textContent = "Player one using keyboard (No gamepads available)";
				gamePadCheck.disabled = true;
				gamePadCheck.checked = false;
			}
		}
	}

	function pauseListeners() {
		pause = true;
	}

	function startListeners() {
		pause = false;
	}

	ui.ready(function() {
		var gamePadCheck = ui.get("playerOneUseGamepad");
		var serverName = ui.get("server");
		document.querySelector("input[data-ip]").addEventListener("click", function() {
			serverName.value = event.target.dataset.ip;
			server.connect(event.target.dataset.ip);
		});
		ui.setAttribute(serverName, "style", "border:1px solid grey;background:rgba(255,255,255,1)");
		serverName.addEventListener("focus", input.pauseListeners);
		serverName.addEventListener("blur", input.startListeners);
		serverName.addEventListener("keydown", function(event) {
			if (event.keyCode === 13) {
				event.target.blur();
				// event.target.disabled = true;
				server.connect(event.target.value);
			} else {
				ui.setAttribute(serverName, "style", "border:1px solid grey;background:rgba(255,255,255,1)");
			}
		});
		gamePadCheck.addEventListener("click", function(event) {
			if (gamePadCheck.checked) {
				event.target.nextSibling.textContent = "Player One: Switch to Keyboard (Using gamepad)";
			} else {
				event.target.nextSibling.textContent = "Player One: Switch to Gamepad (Using keyboard)";
			}
			connection.playerOneSwapInput();
		});
	});
	// prevent context menus from appearing via right click
	document.addEventListener("contextmenu", preventDefault);
	return {
		preventDefault: preventDefault,
		allowPlayerOneToSwitch: allowPlayerOneToSwitch,
		get pause() {
			return pause;
		},
		pauseListeners: pauseListeners,
		startListeners: startListeners
	};
}(window, document));