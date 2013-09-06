var physics = (function() {
	/*
	 *  This is the Point constructor. Polygon uses this object, but it is
	 *  just a really simple set of x and y coordinates.
	 */

	function Point(px, py) {
		this.x = px;
		this.y = py;
		return this;
	}

	/*
	 * rotate the polygon by a number of radians
	 */

	function rotate(object, radians) {
		for (var i = 0; i < object.points.length; i++) {
			var x = object.points[i].x;
			var y = object.points[i].y;
			object.points[i].x = Math.cos(radians) * x - Math.sin(radians) * y;
			object.points[i].y = Math.sin(radians) * x + Math.cos(radians) * y;
		}
	}

	function getSides(target, angle) {
		if (target.points.length) {
			var height = (target.height / 2);
			var width = (target.width / 2);
			target.points[0].x = -width;
			target.points[0].y = -height;
			target.points[1].x = +width;
			target.points[1].y = -height;
			target.points[2].x = +width;
			target.points[2].y = +height;
			target.points[3].x = -width;
			target.points[3].y = +height;
		} else {
			target.points.push(new Point(-width, -height));
			target.points.push(new Point(+width, -height));
			target.points.push(new Point(+width, +height));
			target.points.push(new Point(-width, +height));
		}
		rotate(target, angle * Math.PI / 180);
	}

	/*
	used to determine any inconsistencies between what the player sees and what the physics engine sees.
	*/
	function render() {
		draw.custom(function(canvas, context) {
			bullets.forEach(function(bullet, index, bulletList) {
				getSides(bullet, bullet.angle);
				context.fillStyle = "black";
				context.beginPath();
				context.moveTo(bullet.points[0].x + bullet.x, bullet.points[0].y + bullet.y);
				for (var i = 1; i < bullet.points.length; i++) {
					context.lineTo(bullet.points[i].x + bullet.x, bullet.points[i].y + bullet.y);
				}
				context.closePath();
				context.stroke();
				context.fill();

			});
			tanks.forEach(function(tank, index, tankList) {
				getSides(tank, tank.angle);
				context.fillStyle = "black";
				context.beginPath();
				context.moveTo(tank.points[0].x + tank.x, tank.points[0].y + tank.y);
				for (var i = 1; i < tank.points.length; i++) {
					context.lineTo(tank.points[i].x + tank.x, tank.points[i].y + tank.y);
				}
				context.closePath();
				context.stroke();
				context.fill();
			});
		});
	}

	/*
	 *  To detect intersection with another Polygon object, this
	 *  function uses the Separating Axis Theorem. It returns false
	 *  if there is no intersection, or an object if there is. The object
	 *  contains 2 fields, overlap and axis. Moving the polygon by overlap
	 *  on axis will get the polygons out of intersection.
	 */

	function parse(bullet, tank) {
		var axis = new Point(0, 0);
		var tmp, minA, maxA, minB, maxB;
		var side, i;
		var smallest = null;
		var overlap = 99999999;
		var tankAngle = 0;
		var oldAngle = bullet.angle - tank.angle;
		bulletAngle = Math.abs(oldAngle) % 360;
		if (oldAngle < 0) {
			bulletAngle = 360 - bulletAngle;
		}
		getSides(bullet, bullet.angle);
		getSides(tank, tank.angle);


		/* test polygon A's sides */
		for (side = 0; side < bullet.points.length; side++) {
			/* get the axis that we will project onto */
			if (side == 0) {
				axis.x = bullet.points[bullet.points.length - 1].y - bullet.points[0].y;
				axis.y = bullet.points[0].x - bullet.points[bullet.points.length - 1].x;
			} else {
				axis.x = bullet.points[side - 1].y - bullet.points[side].y;
				axis.y = bullet.points[side].x - bullet.points[side - 1].x;
			}

			/* normalize the axis */
			tmp = Math.sqrt(axis.x * axis.x + axis.y * axis.y);
			axis.x /= tmp;
			axis.y /= tmp;

			/* project polygon A onto axis to determine the min/max */
			minA = maxA = 0;
			for (i = 1; i < bullet.points.length; i++) {
				tmp = bullet.points[i].x * axis.x + bullet.points[i].y * axis.y;
				if (tmp > maxA) {
					maxA = tmp;
				} else if (tmp < minA) {
					minA = tmp;
				}
			}
			/* correct for offset */
			tmp = bullet.x * axis.x + bullet.y * axis.y;
			minA += tmp;
			maxA += tmp;

			/* project polygon B onto axis to determine the min/max */
			minB = maxB = 0;
			for (i = 1; i < tank.points.length; i++) {
				tmp = tank.points[i].x * axis.x + tank.points[i].y * axis.y;
				if (tmp > maxB) {
					maxB = tmp;
				} else if (tmp < minB) {
					minB = tmp;
				}
			}
			/* correct for offset */
			tmp = tank.x * axis.x + tank.y * axis.y;
			minB += tmp;
			maxB += tmp;
			/* test if lines intersect, if not, return false */
			if (maxA < minB || minA > maxB) {
				return false;
			} else {
				var o = (maxA > maxB ? maxB - minA : maxA - minB);
				if (o < overlap) {
					overlap = o;
					smallest = {
						x: axis.x,
						y: axis.y
					};
				}
				if (overlap < 0.000001) {
					return false;
				}
			}
		}

		/* test polygon B's sides */
		for (side = 0; side < tank.points.length; side++) {
			/* get the axis that we will project onto */
			if (side == 0) {
				axis.x = tank.points[tank.points.length - 1].y - tank.points[0].y;
				axis.y = tank.points[0].x - tank.points[tank.points.length - 1].x;
			} else {
				axis.x = tank.points[side - 1].y - tank.points[side].y;
				axis.y = tank.points[side].x - tank.points[side - 1].x;
			}

			/* normalize the axis */
			tmp = Math.sqrt(axis.x * axis.x + axis.y * axis.y);
			axis.x /= tmp;
			axis.y /= tmp;

			/* project polygon A onto axis to determine the min/max */
			minA = maxA = 0;
			for (i = 1; i < bullet.points.length; i++) {
				tmp = bullet.points[i].x * axis.x + bullet.points[i].y * axis.y;
				if (tmp > maxA) {
					maxA = tmp;
				} else if (tmp < minA) {
					minA = tmp;
				}
			}
			/* correct for offset */
			tmp = bullet.x * axis.x + bullet.y * axis.y;
			minA += tmp;
			maxA += tmp;

			/* project polygon B onto axis to determine the min/max */
			minB = maxB = 0;
			for (i = 1; i < tank.points.length; i++) {
				tmp = tank.points[i].x * axis.x + tank.points[i].y * axis.y;
				if (tmp > maxB) {
					maxB = tmp;
				} else if (tmp < minB) {
					minB = tmp;
				}
			}
			/* correct for offset */
			tmp = tank.x * axis.x + tank.y * axis.y;
			minB += tmp;
			maxB += tmp;
			/* test if lines intersect, if not, return false */
			if (maxA < minB || minA > maxB) {
				return false;
			} else {
				var o = (maxA > maxB ? maxB - minA : maxA - minB);
				if (o < overlap) {
					overlap = o;
					smallest = {
						x: axis.x,
						y: axis.y
					};
				}
				if (overlap < 0.000001) {
					return false;
				}
			}
		}
		var tx = tank.x;
		var ty = tank.y;
		var bx = bullet.x;
		var by = bullet.y;
		return {
			"overlap": overlap + 0.001,
			"axis": smallest
		};
	}

	return {
		Point: Point,
		render: render,
		parse: parse
	};
}());
if (typeof module !== "undefined") {
	module.exports = physics;
}