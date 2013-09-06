var bullets = (function() {
	var bulletList = [];
	var oldBullets = [];
	var weaponList = ["cannon", "spread", "flame", "laser"];
	var weapons = {
		cannon: {
			damage: 1,
			distance: 100,
			speed: 100,
			width: 5,
			height: 5,
			shells: 1,
			reload: 750,
			color: "orange",
			collide: function(bullet, tank) {
				tank.health -= bullet.damage;
				destroy(bullet)
			}
		},
		spread: {
			damage: 1,
			distance: 100,
			speed: 100,
			width: 5,
			height: 5,
			shells: 3,
			reload: 1500,
			color: "green",
			directionModifier: function(bullet, weapon, index) {
				bullet.angle = bullet.angle + (index - Math.floor(weapon.shells / 2)) * 30;
				return bullet;
			},
			collide: function(bullet, tank) {
				tank.health -= bullet.damage;
				destroy(bullet)

			}
		},
		flame: {
			damage: 1,
			distance: 75,
			speed: 100,
			width: 1,
			height: 1,
			shells: 1,
			reload: 25,
			color: "red",
			frameModifier: function(bullet) {
				var percent = (bullet.currentDistance / bullet.distance);
				bullet.speed = bullet.speed + (25 * (percent * 10) - 10);
				bullet.width = Math.abs(weapons.flame.width * (percent * 10));
				bullet.height = Math.abs(weapons.flame.height * (percent * 10));
				bullet.damage = bullet.damage - percent / 8
			},
			collide: function(bullet, tank) {
				tank.health -= bullet.damage;
				destroy(bullet)

			}
		},
		laser: {
			damage: 1,
			distance: 1,
			speed: 0,
			duration: 400,
			width: 150,
			height: 3,
			shells: 1,
			reload: 700,
			color: "blue",
			frameModifier: function(bullet) {
				bullet.x = adjustPosition(bullet.source.x, bullet.source.turretAngle, "cos", bullet.source, bullet);
				bullet.y = adjustPosition(bullet.source.y, bullet.source.turretAngle, "sin", bullet.source, bullet);
				bullet.angle = bullet.source.turretAngle;
			},
			collide: function(bullet, tank, result) {
				if (!bullet.contactTime) {
					bullet.contactTime = time.now();
				}

				console.log(result, bullet)
				// destroy(bullet)

			}
		}
	};

	function destroy(bullet) {
		for (var i = 0; i < bulletList.length; i++) {
			if (bulletList[i].id === bullet.id) {
				// console.log("destroying bullet", bulletList[i], bullet.id);
				helper.removeFromArrayAtIndex(bulletList, i);
				return true;
			}
		}
	}

	function adjustPosition(position, distanceA, distanceB, angle, type) {
		return position + (((distanceA / 2) + (distanceB / 2)) * Math[type](angle * (Math.PI / 180)));
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
		bullet.color = weapon.color;
		bullet.x = adjustPosition(x, tank.width, bullet.width, angle, "cos");
		bullet.y = adjustPosition(y, tank.height, bullet.height, angle, "sin");
		bullet.angle = angle;
		bullet.collide = weapon.collide;
		bullet.contactTime = 0; // used for weapons like the laser where the weapon does damage as it has contact with the player
		if (weapon.duration) {
			bullet.duration = weapon.duration;
		}
		bullet.remainder = 0;
		bullet.startTime = time.now();
		bullet.frameModifier = weapon.frameModifier;
		bullet.points = [];
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
		var weapon = weapons[tank.weaponType];
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
			var result = physics.parse(bullet, tank);
			if (result) {
				tanks.hurt(bullet, tank, result);
			}
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
		bullet.currentDistance += Math.sqrt((xSpeed * xSpeed) + (ySpeed * ySpeed));
		bullet.x += xSpeed;
		bullet.y += ySpeed;
		if (typeof bullet.frameModifier === "function") {
			bullet.frameModifier(bullet);
		}
		// remove bullet if it goes off screen
		if (bullet.x > 700 || bullet.x < 0 || bullet.y > 700 || bullet.y < 0 || bullet.currentDistance >= bullet.distance || (bullet.duration && bullet.duration < time.now() - bullet.startTime)) {
			destroy(bullet);
		}
	}

	function remove(bullet) {
		bulletList
	}

	function reloadTime(type) {
		if (weapons[type].duration) {
			return weapons[type].reload + weapons[type].duration;;
		}
		return weapons[type].reload;
	}

	function color(type) {
		return weapons[type].color;
	}

	function collide(bullet, tank, result) {
		bullet.collide(bullet, tank, result);
	}

	return {
		reloadTime: reloadTime,
		create: create,
		get weaponList() {
			return weaponList;
		},
		collide: collide,
		color: color,
		parse: parse,
		forEach: forEach
	};
}());
if (typeof module !== "undefined") {
	module.exports = bullets;
}