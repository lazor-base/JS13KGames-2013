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

function randomFromInterval(from, to) {
	return Math.floor(Math.random() * (to - from + 1) + from);
}

if (typeof module !== "undefined") {
	module.exports.contains = contains;
	module.exports.removeFromArray = removeFromArray;
	module.exports.removeFromArrayAtIndex = removeFromArrayAtIndex;
	module.exports.randomFromInterval = randomFromInterval;
}