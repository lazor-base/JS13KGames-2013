var bullets = (function() {
	var bulletList = [];
	var oldBullets = [];



	function destroy(bullet) {
		for (var i = 0; i < bulletList.length; i++) {
			if (bulletList[i].id === bullet.id) {
				helper.removeFromArrayAtIndex(bulletList, i);
				return true;
			}
		}
	}

	function getDimention(axis, bullet) {
		if (axis === "x") {
			var dimention = "width";
		} else {
			var dimention = "height";
		}
		return (bullet.source[dimention] / 2) + (bullet[dimention] / 2);
	}

	function changePosition(axis, position, angle, bullet) {
		var x = getDimention("x", bullet);
		var y = getDimention("y", bullet);
		if (axis === "x") {
			var math = "cos";
		} else {
			var math = "sin";
		}
		return position + (x + y) * Math[math](angle * (Math.PI / 180));
	}

	function Bullet(angle, x, y, weapon, tank) {
		if (oldBullets.length > 0) {
			var bullet = helper.removeFromArrayAtIndex(oldBullets);
		} else {
			var bullet = {};
		}
		bullet.source = tank;
		bullet.id = Math.random();
		bullet.damage = weapon.damage;
		bullet.currentDistance = 0;
		bullet.distance = weapon.distance; // how far the bullet should go (pixels)
		bullet.speed = weapon.speed; // how many pixels per second
		bullet.width = weapon.width;
		bullet.height = weapon.height;
		bullet.maxWidth = weapon.width;
		bullet.maxHeight = weapon.height;
		bullet.color = weapon.color;
		bullet.x = changePosition("x", x, angle, bullet);
		bullet.y = changePosition("y", y, angle, bullet);
		bullet.angle = angle;
		bullet.collide = weapon.collide;
		bullet.hurt = weapon.hurt;
		bullet.noCollide = weapon.noCollide;
		bullet.contactTime = 0; // used for weapons like the laser where the weapon does damage as it has contact with the player
		if (weapon.duration) {
			bullet.duration = weapon.duration;
		}
		bullet.remainder = 0;
		bullet.deltaTime = 0;
		bullet.startTime = time.now();
		bullet.frameModifier = weapon.frameModifier;
		if (!bullet.points) { // old points are just objects of x and y, and there is no need to replace those
			bullet.points = [];
		}
		return bullet;
	}

	function forEach(fn) {
		for (var i = 0; i < bulletList.length; i++) {
			fn(bulletList[i], i, bulletList);
		}
	}

	function parse(deltaTime) {
		forEach(function(bullet, index, bulletList) {
			processMove(bullet, deltaTime);
		});
		// separate for loop because the for loop doesnt take into account removed bullets
		forEach(function(bullet, index, bulletList) {
			processCollision(bullet);
		});
	}

	function create(tank) {
		var weapon = weapons.definition(tank.weaponName);
		for (var i = 0; i < weapon.shells; i++) {
			var bullet = Bullet(tank.turretAngle, tank.x, tank.y, weapon, tank);
			if (typeof weapon.directionModifier === "function") {
				bullet = weapon.directionModifier(bullet, weapon, i);
			}
			bulletList.push(bullet);
		}
	}

	/**
	 * Pythagorean theorem
	 * @param fromX
	 * @param fromY
	 * @param toX
	 * @param toY
	 */

	function findDistance(fromX, fromY, toX, toY) {
		var a = Math.abs(fromX - toX);
		var b = Math.abs(fromY - toY);

		return Math.sqrt((a * a) + (b * b));
	}

	function processCollision(bullet) {
		tanks.forEach(function(tank, index, tankList) {
			if (tank.spawned) {
				var result = physics.parse(bullet, tank);
				if (result) {
					tanks.hurt(bullet, tank, result);
				} else {
					bullets.noCollide(bullet);
				}
			}
		});
	}

	function processMove(bullet, deltaTime) {
		bullet.deltaTime = deltaTime;
		if (typeof bullet.frameModifier === "function") {
			bullet.frameModifier(bullet);
		}
		var MAX_SPEED = bullet.speed * (deltaTime / 1000);
		var turnAngle = bullet.angle;
		var reverse = turnAngle;
		turnAngle = Math.abs(turnAngle) % 360;
		if (reverse < 0) {
			turnAngle = 360 - turnAngle;
		}
		var xSpeed = MAX_SPEED * Math.cos(turnAngle * Math.PI / 180);
		var ySpeed = MAX_SPEED * Math.sin(turnAngle * Math.PI / 180);
		bullet.currentDistance += Math.sqrt((xSpeed * xSpeed) + (ySpeed * ySpeed));
		bullet.x += xSpeed;
		bullet.y += ySpeed;
		// remove bullet if it goes off screen
		if (bullet.x > 900 || bullet.x < 0 || bullet.y > 600 || bullet.y < 0 || bullet.currentDistance >= bullet.distance || (bullet.duration && bullet.duration < time.now() - bullet.startTime)) {
			destroy(bullet);
		}
	}

	function remove(bullet) {
		bulletList
	}

	function reloadTime(name) {
		var weapon = weapons.definition(name);
		if (weapon.duration) {
			return weapon.reload + weapon.duration;
		}
		return weapon.reload;
	}

	function collide(bullet, tank, result) {
		if(typeof draw !== "undefined") {
			effects.damageEffect(bullet,tank);
		}
		bullet.collide(bullet, tank, result);
	}

	function hurt(bullet, tank, result) {
		bullet.hurt(bullet, tank, result);
	}

	function noCollide(bullet) {
		if (typeof bullet.noCollide === "function") {
			bullet.noCollide(bullet);
		}
	}

	return {
		reloadTime: reloadTime,
		create: create,
		collide: collide,
		noCollide: noCollide,
		parse: parse,
		hurt: hurt,
		destroy: destroy,
		changePosition: changePosition,
		forEach: forEach
	};
}());
if (typeof module !== "undefined") {
	module.exports = bullets;
}