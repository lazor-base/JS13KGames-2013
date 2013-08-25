var animationLoop = (function(window) {
	var animationLoop = null;
	var stop = false;
	var numberOfTicks = 50;
	var currentTick = 0;
	var lastTick = window.performance.now();
	var functions = [];

	function startLoop() {
		currentTick = window.performance.now();
		if (currentTick - lastTick >= numberOfTicks) {
			lastTick = currentTick;
			for (var i = 0; i < functions.length; i++) {
				if (stop === false) {
					functions[i]();
				}
			}
		}
		if (stop === false) {
			animationLoop = window.requestAnimationFrame(startLoop);
		}
	}

	function stopLoop() {
		stop = true;
	}

	function addToLoop(fn) {
		functions.push(fn);
		return (functions.length - 1);
	}

	function removeFromLoop(id) {
		functions.splice(id, 1);
	}

	function setSpeed(speed) {
		numberOfTicks = speed;
	}
	return {
		setSpeed: setSpeed,
		startLoop: startLoop,
		stopLoop: stopLoop,
		addToLoop: addToLoop,
		removeFromLoop: removeFromLoop
	};
}(window));
if (typeof module !== "undefined") {
	module.exports = animationLoop;
}