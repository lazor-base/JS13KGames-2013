var draw = (function(window, document) {
	var canvas;
	var context;
	var lightingCanvas;
	var lightingContext;
	ui.ready(function() {
		canvas = ui.get("game");
		context = canvas.getContext("2d");
		lightingCanvas = ui.get("lighting");
		lightingContext = lightingCanvas.getContext("2d");
	});

	function colorNameToHex(source, returnUnresolved) { // color list from http://stackoverflow.com/q/1573053/731179  with added gray/gray
		var hexRGB, definedColorNames = {
			"aqua": "#00ffff",
			"black": "#000000",
			"blue": "#0000ff",
			"brown": "#a52a2a",
			"darkblue": "#00008b",
			"darkgray": "#a9a9a9",
			"darkgreen": "#006400",
			"darkorange": "#ff8c00",
			"darkred": "#8b0000",
			"darkviolet": "#9400d3",
			"gold": "#ffd700",
			"gray": "#808080",
			"green": "#008000",
			"lightblue": "#add8e6",
			"lightgrey": "#d3d3d3",
			"lightgreen": "#90ee90",
			"lightpink": "#ffb6c1",
			"lightyellow": "#ffffe0",
			"magenta": "#ff00ff",
			"mediumblue": "#0000cd",
			"mediumpurple": "#9370d8",
			"navy": "#000080",
			"orange": "#ffa500",
			"pink": "#ffc0cb",
			"purple": "#800080",
			"red": "#ff0000",
			"silver": "#c0c0c0",
			"snow": "#fffafa",
			"violet": "#ee82ee",
			"white": "#ffffff",
			"yellow": "#ffff00",
			"darkgrey": "#a9a9a9",
			"grey": "#808080",
			"lightgray": "#d3d3d3"
		};
		if (definedColorNames[source.toLowerCase()] !== undefined) {
			hexRGB = definedColorNames[source.toLowerCase()];
			// to keep unresolved strings set flag returnUnresolved to true
		} else {
			if (returnUnresolved) {
				hexRGB = source;
			} else {
				hexRGB = undefined;
			}
		}
		return hexRGB;
	};

	function setAlpha(source, alpha) {
		// change alpha of color string in any css color space
		// intended for use in canvas/svg
		// currently implemented:
		// css defined colors               > rgba
		// rgba, rgb, r%g%b%, #rgb, #rrggbb > rgba
		// hsl, hsla                        > hsla
		// unresolved                       > as is
		//
		// If no alpha is passed its is set to 1 or keeps the value in rgba/hsla

		// kill whitespace split at "(", ")", ","
		var i, hex, c = source.replace(/\s/g, '').split(/[\(\),]/);

		function extractHex(string) {
			if (string.charAt(0) === "#") { // detect hex strings
				hex = string.replace(/#/g, '');
				string = "hex";
			} else {
				hex = undefined;
			}
			return string;
		}
		extractHex(c[0]);
		if (["rgba", "rgb", "hsla", "hsl", "hex"].indexOf(c[0]) === -1) {
			c[0] = extractHex(colorNameToHex(c[0], 1)); // detect defined color names
		}
		if (c[0] === "rgba") {
			if (alpha === undefined) {
				alpha = c[4];
			}
			c = "rgba(" + c[1] + ", " + c[2] + ", " + c[3] + ", " + alpha + ")";
		} else if (c[0] === "rgb") {
			if (alpha === undefined) {
				alpha = 1;
			}
			//  if colors are in percentage values
			for (i = 1; i <= 3; i = i + 1) {
				if (c[i].charAt(c[i].length - 1) === "%") {
					c[i] = Math.round(c[i].replace(/%/g, '') * 2.55);
				}
			}
			c = "rgba(" + c[1] + ", " + c[2] + ", " + c[3] + ", " + alpha + ")";
		} else if (c[0] === "hsl") {
			if (alpha === undefined) {
				alpha = 1;
			}
			c = "hsla(" + c[1] + ", " + c[2] + ", " + c[3] + ", " + alpha + ")";
		} else if (c[0] === "hsla") {
			if (alpha === undefined) {
				alpha = c[4];
			}
			c = "hsla(" + c[1] + ", " + c[2] + ", " + c[3] + ", " + alpha + ")";
		} else if (c[0] === "hex") {
			if (alpha === undefined) {
				alpha = 1;
			}
			if (hex.length === 3) {
				c[1] = parseInt(hex.charAt(0) + hex.charAt(0), 16);
				c[2] = parseInt(hex.charAt(1) + hex.charAt(1), 16);
				c[3] = parseInt(hex.charAt(2) + hex.charAt(2), 16);
			} else if (hex.length === 6) {
				c[1] = parseInt(hex.charAt(0) + hex.charAt(1), 16);
				c[2] = parseInt(hex.charAt(2) + hex.charAt(3), 16);
				c[3] = parseInt(hex.charAt(4) + hex.charAt(5), 16);
			}
			c = "rgba(" + c[1] + ", " + c[2] + ", " + c[3] + ", " + alpha + ")";
		} else {
			c = source;
		}
		return c;
	};

	var arrow = [
		[2, 0],
		[-10, -4],
		[-10, 4]
	];

	function drawFilledPolygon(shape) {
		context.beginPath();
		context.moveTo(shape[0][0], shape[0][1]);

		for (p in shape)
		if (p > 0) context.lineTo(shape[p][0], shape[p][1]);

		context.lineTo(shape[0][0], shape[0][1]);
		context.fill();
	};

	function translateShape(shape, x, y) {
		var rv = [];
		for (p in shape)
		rv.push([shape[p][0] + x, shape[p][1] + y]);
		return rv;
	};

	function rotateShape(shape, ang) {
		var rv = [];
		for (p in shape)
		rv.push(rotatePoint(ang, shape[p][0], shape[p][1]));
		return rv;
	};

	function rotatePoint(ang, x, y) {
		return [
		(x * Math.cos(ang)) - (y * Math.sin(ang)), (x * Math.sin(ang)) + (y * Math.cos(ang))];
	};

	function drawArrow(x1, y1, x2, y2) {
		var ang = Math.atan2(y2 - y1, x2 - x1);
		drawFilledPolygon(translateShape(rotateShape(arrow, ang), x2, y2));
	};

	function bullet(bullet) {
		rotate(bullet.angle, bullet.x, bullet.y, function() {
			context.fillStyle = setAlpha(bullet.color, (bullet.distance - bullet.currentDistance) / bullet.distance);
			context.fillRect(-(bullet.width / 2), -(bullet.height / 2), bullet.width, bullet.height);
		});
	}

	function effect(effect) {
		for (var i = 0; i < effect.particles.length; i++) {
			var particle = effect.particles[i];
			rotate(particle.angle, particle.x, particle.y, function() {
				context.fillStyle = setAlpha(particle.color, (particle.distance - particle.currentDistance) / particle.distance);
				context.fillRect(-(particle.width / 2), -(particle.height / 2), particle.width, particle.height);
			});
		}
	}

	function wall(wall) {
		rotate(wall.angle, wall.x, wall.y, function() {
			context.beginPath();
			context.rect(-(wall.width / 2), -(wall.height / 2), wall.width, wall.height);
			context.fillStyle = "rgba(0,0,0,0.3)";
			context.fill();
		});
	}

	function rotate(angle, x, y, drawFn) {
		context.save();
		context.translate(x, y);
		context.rotate(angle * Math.PI / 180);
		drawFn();
		context.rotate(-angle * Math.PI / 180);
		context.translate(-x, -y);
		context.restore();
	}

	function lighting() {
		lightingContext.beginPath();
		lightingContext.rect(0, 0, lightingCanvas.width, lightingCanvas.height);
		lightingContext.fillStyle = "black";
		lightingContext.fill();
		// lightingContext.shadowOffsetX = 750; // (default 0)
		// lightingContext.shadowOffsetY = 750; // (default 0)
		// lightingContext.shadowBlur = 40; // (default 0)
		// lightingContext.shadowColor = 'rgba(255,255,255,0.5)'; // (default transparent black)
		tanks.forEach(function(tank, index, tankList) {
			var home = connection.remotePlayerIsLocal(tank.remoteId);
			if (home) {
				lightingContext.clearRect(tank.x - (200 / 2), tank.y - (200 / 2), 200, 200);
			}
			var radgrad = lightingContext.createRadialGradient(tank.x, tank.y, 20, tank.x, tank.y, 300);
			if (home) {
				radgrad.addColorStop(0, "rgba(0,0,0,0.2)");
				radgrad.addColorStop(0.1, "rgba(0,0,0,0.75)");
				radgrad.addColorStop(0.38, "rgba(0, 0, 0, 1)");
			} else {
				// radgrad.addColorStop(0, "rgba(255,255,255,0.8)");
				// radgrad.addColorStop(0.1, "rgba(255,255,255,0.25)");
				// radgrad.addColorStop(0.38, "rgba(255, 255, 255, 0)");
			}
			lightingContext.beginPath();
			lightingContext.fillStyle = radgrad;
			lightingContext.arc(tank.x, tank.y, 100, 0, 2 * Math.PI, true);
			lightingContext.closePath();
			lightingContext.fill();
			if (home) {
				lightingContext.beginPath();
				lightingContext.arc(tank.x, tank.y, 124, 0, 2 * Math.PI, true);
				lightingContext.lineWidth = 50;
				lightingContext.strokeStyle = 'black';
				lightingContext.stroke();
				lightingContext.closePath();
			}
		});
	}

	function dot(tank, home) {
		if (home) {
			var color = "cyan";
		} else {
			var color = "lightgrey"
		}

		var weaponColor = weapons.color(tank);
		if (tank.spawned === false && home) {
			color = "rgba(0,0,0,0)";
			weaponColor = "black";
		} else if (tank.spawned === false && !home) {
			return false;
		}
		// draw healthbars
		context.beginPath();
		context.rect(tank.x - 10, tank.y - 20, 20, 5);
		context.fillStyle = "black";
		context.fill();
		context.beginPath();
		context.rect(tank.x - 9, tank.y - 19, (tank.health / tank.fullHealth) * 18, 3);
		context.fillStyle = "lightgreen";
		context.fill();
		// draw tank body
		rotate(tank.angle, tank.x, tank.y, function() {
			context.beginPath();
			context.rect(-(tank.width / 2), -(tank.height / 2), tank.width, tank.height);
			context.fillStyle = color;
			context.fill();
			context.lineWidth = 2;
			context.strokeStyle = weaponColor;
			context.stroke();
			drawArrow(tank.width, 0, tank.width + 10, 0);
		});
		// draw tank turret
		rotate(tank.turretAngle, tank.x, tank.y, function() {
			context.beginPath();
			context.rect(-5, -5, 10, 10);
			context.fillStyle = color;
			context.fill();
			context.lineWidth = 1;
			context.strokeStyle = weaponColor;
			context.stroke();
			context.beginPath();
			context.rect(5, -1.5, 7, 3);
			context.fillStyle = color;
			context.fill();
			context.lineWidth = 1;
			context.strokeStyle = weaponColor;
			context.stroke();
		});
	}

	function clearCanvas() {
		context.clearRect(0, 0, canvas.width, canvas.height);
		lightingContext.clearRect(0, 0, lightingCanvas.width, lightingCanvas.height);
	}

	function custom(fn) {
		fn(canvas, context);
	}
	return {
		custom: custom,
		dot: dot,
		wall: wall,
		rotate: rotate,
		bullet: bullet,
		effect: effect,
		lighting: lighting,
		clearCanvas: clearCanvas,
		canvas: canvas
	};
}(window, document));