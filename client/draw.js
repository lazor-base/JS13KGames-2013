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
		context.fillRect(-10, -5, 20, 10);
		context.rotate(-tank.angle * Math.PI / 180);
		context.translate(-tank.x, -tank.y);
		// context.translate((tank.x + canvas.width / 2)*-1, (tank.y + canvas.height / 2) * -1);
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