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
				bullet.angle = bullet.source.turretAngle;
				bullet.x = changeXPosition(bullet.source.x, bullet, bullet.source, bullet.angle);
				bullet.y = changeYPosition(bullet.source.y, bullet, bullet.source, bullet.angle);
			},
			collide: function(bullet, tank, result) {
				if (bullet.contactTime === 0) {
					bullet.contactTime = time.now();
					tank.health -= bullet.damage / bullet.duration;
				} else {
					tank.health = tank.health - ((bullet.damage * bullet.deltaTime) / bullet.duration);
				}
				var closestTank = (result.axis.x - tank.x) * (result.axis.y - tank.y);
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

	function changeXPosition(xPosition, bullet, tank, angle) {
		var x = getX(bullet, tank);
		var y = getY(bullet, tank);
		return xPosition + (x + y) * Math.cos(angle * (Math.PI / 180));
	}

	function changeYPosition(yPosition, bullet, tank, angle) {
		var x = getX(bullet, tank);
		var y = getY(bullet, tank);
		return yPosition + (x + y) * Math.sin(angle * (Math.PI / 180));
	}

	function getX(bullet, tank) {
		return (tank.width / 2) + (bullet.width / 2);
	}

	function getY(bullet, tank) {
		return (tank.height / 2) + (bullet.height / 2);
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
		bullet.x = changeXPosition(x, bullet, tank, angle);
		bullet.y = changeYPosition(y, bullet, tank, angle);
		bullet.angle = angle;
		bullet.collide = weapon.collide;
		bullet.contactTime = 0; // used for weapons like the laser where the weapon does damage as it has contact with the player
		if (weapon.duration) {
			bullet.duration = weapon.duration;
		}
		bullet.remainder = 0;
		bullet.deltaTime = 0;
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
		bullet.deltaTime = deltaTime;
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