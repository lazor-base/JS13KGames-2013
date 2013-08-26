var animationLoop = (function(window) {
	var animationLoop = null;
	var stop = false;
	var currentTick = 0;
	var lastTick = 0;
	var listenerIds = [];
	var tickListeners = [];
	var frameStart = 0;
	var frameEnd = 0;

	function every(numberOfTicks, callback) {
		function Listener(numberOfTicks, callback) {
			this.numberOfTicks = numberOfTicks;
			this.listeners = [callback];
			this.deltaTime = 0;
			this.lastTick = window.performance.now();
			return this;
		}
		var index = listenerIds.indexOf(numberOfTicks);
		if (index > -1) {
			tickListeners[index].listeners.push(callback);
		} else {
			tickListeners.push(new Listener(numberOfTicks, callback));
			listenerIds.push(numberOfTicks);
		}
	}

	function startLoop() {
		lastTick = currentTick;
		currentTick = window.performance.now();
		for (var i = 0; i < tickListeners.length; i++) {
			var thisListener = tickListeners[i];
			if (stop) {
				return true;
			}
			if (currentTick - thisListener.lastTick >= thisListener.numberOfTicks) {
				thisListener.deltaTime = currentTick - thisListener.lastTick;
				thisListener.lastTick = currentTick;
				for (var e = 0; e < thisListener.listeners.length; e++) {
					if (stop) {
						return true;
					}
					thisListener.listeners[e](thisListener.deltaTime);
				}
			}
		}
		if (stop) {
			return true;
		}
		animationLoop = window.requestAnimationFrame(startLoop);
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

	return {
		get timeSinceLastFrame() {
			return currentTick-lastTick;
		},
		startLoop: startLoop,
		stopLoop: stopLoop,
		every: every,
		removeFromLoop: removeFromLoop
	};
}(window));
if (typeof module !== "undefined") {
	module.exports = animationLoop;
}