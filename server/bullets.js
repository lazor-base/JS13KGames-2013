var bullets = (function() {
	var bulletList = [];
	var oldBullets = [];
	var weaponList = ["cannon", "spread", "flame"];
	var weapons = {
		cannon: {
			damage: 1,
			life: 100,
			speed: 100,
			entropy: 0,
			width: 5,
			height: 5,
			shells: 1,
			reload: 750
		},
		spread: {
			damage: 1,
			life: 100,
			speed: 100,
			entropy: 0,
			width: 5,
			height: 5,
			shells: 3,
			reload: 1500,
			directionModifier: function(bullet, shells, index) {
				bullet.angle = bullet.angle + (index - Math.floor(shells / 2)) * 30;
				return bullet;
			}
		},
		flame: {
			damage: 1,
			life: 25,
			speed: 100,
			entropy: 0,
			width: 1,
			height: 1,
			shells: 1,
			reload: 0,
			frameModifier: function(bullet) {
				var percent = (bullet.life / weapons.flame.life) * 10;
				bullet.speed = bullet.speed + 25
				bullet.width = Math.abs(weapons.flame.width * (percent - 10));
				bullet.height = Math.abs(weapons.flame.height * (percent - 10));
				bullet.damage = bullet.damage - (weapons.flame.life - bullet.life) / 4
			}
		}
	};

	function Bullet(angle, x, y, damage, life, speed, entropy, width, height, frameModifier) {
		if (oldBullets.length > 0) {
			var bullet = helper.removeFromArrayAtIndex(oldBullets);
		} else {
			var bullet = {};
		}
		bullet.id = Math.random();
		bullet.damage = damage;
		bullet.life = life;
		bullet.speed = speed;
		bullet.entropy = entropy;
		bullet.width = width;
		bullet.height = height;
		bullet.x = x;
		bullet.y = y;
		bullet.angle = angle;
		bullet.remainder = 0;
		bullet.frameModifier = frameModifier;
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
			// processCollision(bullet);
		});
	}

	function create(type, angle, x, y) {
		var weapon = weapons[type];
		for (var i = 0; i < weapon.shells; i++) {
			var bullet = Bullet(angle, x, y, weapon.damage, weapon.life, weapon.speed, weapon.entropy, weapon.width, weapon.height, weapon.frameModifier);
			if (typeof weapon.directionModifier === "function") {
				bullet = weapon.directionModifier(bullet, weapon.shells, i);
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
			var tankCenterX = tank.x + (tank.width / 2);
			var tankCenterY = tank.y + (tank.height / 2)
			var unRotatedX = Math.cos(tank.angle) * (bullet.x - tankCenterX) - Math.sin(tank.angle) * (bullet.y - tankCenterY) + tankCenterX;
			var unRotatedY = Math.sin(tank.angle) * (bullet.x - tankCenterX) + Math.cos(tank.angle) * (bullet.y - tankCenterY) + tankCenterY;
			var closestX, closestY;
			// Find the unrotated closest x point from center of unrotated circle
			if (unRotatedX < rect.x) {
				closestX = rect.x;
			} else if (unRotatedX > rect.x + rect.width) {
				closestX = rect.x + rect.width;
			} else {
				closestX = unRotatedX;
			}
			// Find the unrotated closest y point from center of unrotated circle
			if (unrotatedCircleY < rect.y) {
				closestY = rect.y;
			} else if (unrotatedCircleY > rect.y + rect.height) {
				closestY = rect.y + rect.height;
			} else {
				closestY = unrotatedCircleY;
			}
			// Determine collision
			var collision = false;

			var distance = findDistance(unrotatedCircleX, unrotatedCircleY, closestX, closestY);
			if (distance < circle.radius) {
				collision = true; // Collision
			} else {
				collision = false;
			}
			tanks.hurt(bullet, tank);
		});
	}

	function processMove(bullet, deltaTime) {
		var MAX_SPEED = bullet.speed * (deltaTime / 1000);
		var turnAngle = bullet.angle;
		var reverse = turnAngle;
		turnAngle = Math.abs(turnAngle) % 360;
		if (reverse < 0) {
			turnAngle = 360 - turnAngle;
		}
		var xSpeed = MAX_SPEED * Math.cos(turnAngle * Math.PI / 180);
		var ySpeed = MAX_SPEED * Math.sin(turnAngle * Math.PI / 180);
		bullet.x += xSpeed;
		bullet.y += ySpeed;
		if (typeof bullet.frameModifier === "function") {
			bullet.frameModifier(bullet);
		}
		bullet.life--;
		// remove bullet if it goes off screen
		if (bullet.x > 700 || bullet.x < 0 || bullet.y > 700 || bullet.y < 0 || bullet.life <= 0) {
			for (var i = 0; i < bulletList.length; i++) {
				if (bulletList[i].id === bullet.id) {
					helper.removeFromArrayAtIndex(bulletList, i);
					return true;
				}
			}
		}
	}

	function remove(bullet) {
		bulletList
	}

	function reloadTime(type) {
		return weapons[type].reload;
	}

	return {
		reloadTime: reloadTime,
		create: create,
		get weaponList() {
			return weaponList;
		},
		parse: parse,
		forEach: forEach
	};
}());
if (typeof module !== "undefined") {
	module.exports = bullets;
}