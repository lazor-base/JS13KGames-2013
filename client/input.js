var input = (function(window, document) {
	var keysPressed = {};
	var keyPressListeners = [];
	var keyReleaseListeners = [];
	var mouseListeners = [];
	var pause = true;

	function preventDefault(event) {
		event.preventDefault();
	}

	function onKeyPress(fn) {
		keyPressListeners.push(fn);
	}

	function onKeyRelease(fn) {
		keyReleaseListeners.push(fn);
	}

	function onMouse(fn) {
		mouseListeners.push(fn);
	}

	function isPressed(key) {
		if (!keysPressed[key]) {
			releaseKey(key);
		}
		return keysPressed[key];
	}

	function pressKey(key) {
		keysPressed[key] = true;
	}

	function releaseKey(key) {
		keysPressed[key] = false;
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

	function gamepad() {
		gamePad.listenForChanges(function(gamepad) {
			if (gamepad.buttons[gamePad.BUTTONS.START]) {
				connection.onPlayerStart(gamepad.index);
			} else {
				//handle other inputs
			}
		});
	}

	function pauseListeners() {
		pause = true;
	}

	function startListeners() {
		pause = false;
	}
	return {
		preventDefault: preventDefault,
		allowPlayerOneToSwitch: allowPlayerOneToSwitch,
		onKeyRelease: onKeyRelease,
		onMouse: onMouse,
		keyPressListeners: keyPressListeners,
		keyReleaseListeners: keyReleaseListeners,
		mouseListeners: mouseListeners,
		onKeyPress: onKeyPress,
		gamepad: gamepad,
		get pause() {
			return pause;
		},
		pauseListeners: pauseListeners,
		startListeners: startListeners
	};
}(window, document));

ui.ready(function() {
	var gamePadCheck = ui.get("playerOneUseGamepad");
	var serverName = ui.get("server");
	document.querySelector("input[data-ip]").addEventListener("click",function(){
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

function preventDefault(event) {
	event.preventDefault();
}

function keyDown(event) {
	if (input.pause === false) {
		for (var i = 0; i < input.keyPressListeners.length; i++) {
			input.keyPressListeners[i](event);
		}
	}
}

function keyUp(event) {
	if (input.pause === false) {
		for (var i = 0; i < input.keyReleaseListeners.length; i++) {
			input.keyReleaseListeners[i](event);
		}
	}
}

var mouse = {
	x: null,
	y: null
};

function mouseDown(event) {
	if (event.target.nodeName === "CANVAS") {
		var serverName = ui.get("server");
		serverName.blur();
		event.target.focus();
		preventDefault(event);
		if (event.offsetX || event.offsetX == 0) { //for webkit browser like safari and chrome
			mouse.x = event.offsetX;
			mouse.y = event.offsetY;
		} else if (event.layerX || event.layerX == 0) { // for mozilla firefox
			mouse.x = event.layerX;
			mouse.y = event.layerY;
		}
		for (var i = 0; i < input.mouseListeners.length; i++) {
			input.mouseListeners[i](event);
		}
	}
}

// bind keylistener and mouse listener to the page
document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);
document.addEventListener("mousedown", mouseDown);