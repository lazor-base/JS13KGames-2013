var draw = (function(window, document) {
	var canvas;
	var context;
	ui.ready(function() {
		canvas = ui.get("game");
		context = canvas.getContext("2d");
	});

	function bullet(bullet) {
		context.strokeStyle = "blue";
		context.fillStyle = "blue";
		context.save();
		context.translate(bullet.x, bullet.y);
		context.rotate(bullet.angle * Math.PI / 180);
		context.fillRect(-(bullet.height / 2), -(bullet.width / 2), bullet.height, bullet.width);
		context.rotate(bullet.angle * Math.PI / 180);
		context.translate(-bullet.x, -bullet.y);
		context.restore();
	}

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
		context.fillRect(-(tank.height / 2), -(tank.width / 2), tank.height, tank.width);
		context.rotate(-tank.angle * Math.PI / 180);
		context.translate(-tank.x, -tank.y);
		context.restore();
		context.save();
		context.translate(tank.x, tank.y);
		context.rotate(tank.turretAngle * Math.PI / 180);
		context.lineWidth = 1;
		context.beginPath();
		context.moveTo(0, 0);
		context.lineTo(75, 0);
		context.stroke();
		if (tank.shoot) {
			context.strokeStyle = "green";
			context.fillStyle = "green";
			context.lineWidth = 1;
			context.beginPath();
			context.moveTo(0, 0);
			context.lineTo(500, 0);
			context.stroke();
		}
		context.rotate(-tank.turretAngle * Math.PI / 180);
		context.translate(-tank.x, -tank.y);
		context.restore();
	}

	function execute(command, deltaTime, remainder) {
		if (typeof command.shoot !== "undefined") {
			var tank = tanks.getTankById(command.remoteId);
			context.save();
			context.translate(tank.x, tank.y);
			context.rotate(tank.turretAngle * Math.PI / 180);
			context.strokeStyle = "green";
			context.fillStyle = "green";
			context.lineWidth = 1;
			context.beginPath();
			context.moveTo(0, 0);
			context.lineTo(500, 0);
			context.stroke();
			context.rotate(-tank.turretAngle * Math.PI / 180);
			context.translate(-tank.x, -tank.y);
			context.restore();
		}
	}

	function clearCanvas() {
		context.clearRect(0, 0, canvas.width, canvas.height);
	}
	return {
		dot: dot,
		bullet: bullet,
		clearCanvas: clearCanvas,
		execute: execute,
		canvas: canvas
	};
}(window, document));