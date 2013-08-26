var draw = (function(window, document) {
	var canvas;
	var context;
	ui.ready(function() {
		canvas = ui.get("game");
		context = canvas.getContext("2d");
	});

	function dot(tank, home) {
		context.save();
		if (home) {
			context.strokeStyle = "red";
			context.fillStyle = "red";
		} else {
			context.strokeStyle = "black";
			context.fillStyle = "black";
		}
		context.translate(tank.x, tank.y);
		context.rotate(tank.angle * Math.PI / 180);
		context.fillRect(tank.x - 5, tank.y - 10, 10, 20);
		context.translate(-tank.x, -tank.y);
		context.restore();
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