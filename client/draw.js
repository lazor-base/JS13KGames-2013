var draw = (function(window, document) {
	var canvas;
	var context;
	ui.ready(function() {
		canvas = ui.get("game");
		context = canvas.getContext("2d");
	});

	function dot(x, y, home) {
		if (home) {
			context.strokeStyle = "red";
			context.fillStyle = "red";
		} else {
			context.strokeStyle = "black";
			context.fillStyle = "black";
		}
		context.fillRect(x - 1, y - 1, 3, 3);
	}

	function clearCanvas() {
		context.clearRect(0, 0, canvas.width, canvas.height);
	}
	return {
		dot: dot,
		clearCanvas: clearCanvas,
		canvas: canvas
	};
}(window, document));