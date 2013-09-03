var helper = (function() {
	function contains(array, item) {
		return array.indexOf(item) > -1;
	}

	function removeFromArray(array, item) {
		var index = 0;
		if (typeof item !== "undefined") {
			index = array.indexOf(item);
		}
		return removeFromArrayAtIndex(array, index);
	}

	function removeFromArrayAtIndex(array, index) {
		return array.splice(index || 0, 1)[0];
	}

	function randomFromInterval(min, max) {
		return Math.floor(Math.random() * (max - min + 1) + min);
	}
	return {
		contains: contains,
		removeFromArray: removeFromArray,
		removeFromArrayAtIndex: removeFromArrayAtIndex,
		randomFromInterval: randomFromInterval
	};
}());

if (typeof module !== "undefined") {
	module.exports = helper;
}