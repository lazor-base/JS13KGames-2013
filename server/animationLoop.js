var animationLoop = (function(window) {
	var animationLoop = null;
	var stop = false;
	var currentTick = 0;
	var listenerIds = [];
	var tickListeners = [];

	function every(numberOfTicks, callback) {
		function Listener(numberOfTicks, callback) {
			this.numberOfTicks = numberOfTicks;
			this.listeners = [callback];
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
		currentTick = window.performance.now();
		for (var i = 0; i < tickListeners.length; i++) {
			var thisListener = tickListeners[i];
			if (stop) {
				return true;
			}
			if (currentTick - thisListener.lastTick >= thisListener.numberOfTicks) {
				thisListener.lastTick = currentTick;
				for (var e = 0; e < thisListener.listeners.length; e++) {
					if (stop) {
						return true;
					}
					thisListener.listeners[e]();
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
		startLoop: startLoop,
		stopLoop: stopLoop,
		every: every,
		removeFromLoop: removeFromLoop
	};
}(window));
if (typeof module !== "undefined") {
	module.exports = animationLoop;
}