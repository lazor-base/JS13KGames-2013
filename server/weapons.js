var weapons = (function() {
	var weaponList = ["cannon", "spread", "flame", "laser"];
	var weapons = {
		cannon: {
			damage: 1,
			distance: 500,
			speed: 150,
			width: 5,
			height: 5,
			shells: 1,
			reload: 750,
			color: "orange",
			collide: function(bullet, tank) {
				bullets.destroy(bullet)
			},
			hurt: function(bullet, tank) {
				tank.health -= bullet.damage;
				tanks.death(tank, bullet);
			}
		},
		spread: {
			damage: 1,
			distance: 500,
			speed: 100,
			width: 5,
			height: 5,
			shells: 4,
			reload: 1500,
			color: "green",
			directionModifier: function(bullet, weapon, index) {
				var maxAngle = 40;
				bullet.angle = bullet.angle + (-maxAngle + index * (maxAngle * 2 / (weapon.shells - 1)))
				return bullet;
			},
			collide: function(bullet, tank) {
				bullets.destroy(bullet)
			},
			hurt: function(bullet, tank) {
				tank.health -= bullet.damage;
				tanks.death(tank, bullet);
			}
		},
		flame: {
			damage: 0.1,
			distance: 250,
			speed: 80,
			width: 1,
			height: 1,
			shells: 1,
			reload: 250,
			color: "red",
			frameModifier: function(bullet) {
				var percent = (bullet.currentDistance / bullet.distance);
				bullet.speed = bullet.speed + (25 * (percent * 10) - 10);
				bullet.width = Math.abs(weapons.flame.width * (percent * 10));
				bullet.height = Math.abs(weapons.flame.height * (percent * 10));
				bullet.damage = bullet.damage - percent / 8
			},
			collide: function(bullet, tank) {
				bullets.destroy(bullet)
			},
			hurt: function(bullet, tank) {
				tank.health -= bullet.damage;
				tanks.death(tank, bullet);
			}
		},
		laser: {
			damage: 2,
			distance: 1,
			speed: 0,
			duration: 1000,
			width: 150,
			height: 3,
			shells: 1,
			reload: 1500,
			color: "blue",
			frameModifier: function(bullet) {
				bullet.angle = bullet.source.turretAngle;
				bullet.x = bullets.changePosition("x", bullet.source.x, bullet.angle, bullet);
				bullet.y = bullets.changePosition("y", bullet.source.y, bullet.angle, bullet);
			},
			hurt: function(bullet, tank, result) {
				if (bullet.contactTime === 0) {
					bullet.contactTime = time.now();
					tank.health -= bullet.damage / bullet.duration;
				} else {
					tank.health = tank.health - ((bullet.damage * bullet.deltaTime) / bullet.duration);
				}
				tanks.death(tank, bullet);
			},
			collide: function(bullet, tank, result) {
				// draw.custom(function(canvas, context) {
				// 	// console.log(tank.x-result.axis.x-5,tank.y-result.axis.y-5)
				// 	// draw.rotate(tank.angle, tank.x, tank.y, function() {
				// 	var position1 = (bullet.width / 2) + (bullet.height / 2);
				// 	var xBullet = (bullet.x - position1 * Math.cos(bullet.angle * Math.PI / 180)) - 5;
				// 	var yBullet = (bullet.y - position1 * Math.sin(bullet.angle * Math.PI / 180)) - 5;
				// 	var position2 = (tank.width / 2) + (tank.height / 2);
				// 	var xTank = (tank.x - (tank.width / 2) * Math.cos(tank.angle * Math.PI / 180)) - 5;
				// 	var yTank = (tank.y - (tank.height / 2) * Math.sin(tank.angle * Math.PI / 180)) - 5;

				// 	function slope(x1, y1, x2, y2) {
				// 		return (x1 - x2) / (y1 - y2);
				// 	}
				// 	var bulletSlope = slope(bullet.x, bullet.y, xBullet, yBullet);
				// 	var tankSlope = slope(tank.x, tank.y, xTank, yTank);
				// 	var bulletYintercept = bullet.y - (bulletSlope * bullet.x);
				// 	var tankYintercept = tank.y - (tankSlope * tank.x);


				// 	context.rect(xBullet, yBullet, 10, 10);
				// 	context.rect(xTank, yTank, 10, 10);
				// 	context.fillStyle = "red";
				// 	context.fill();
				// 	// });
				// });
				/*
				6:40 PM - C_master: Well, heres whatcha do
				6:40 PM - C_master: First, you should probobly get a cartesian equation of these two lines, twould be nice to get.
				6:40 PM - C_master: y = mx+b
				6:41 PM - C_master: m = Slope
				6:41 PM - C_master: rise/run
				6:41 PM - C_master: Sonce its a straight line, the slope is a actual number (unlike in calculus, where slope is a varaible)
				6:42 PM - C_master: Pick two random points on the line, take the difference of the y's, divide by the difference in x. THeres your slope
				6:42 PM - C_master: Then, ever this into the equation using one of the x,y pairs you used to get b
				6:43 PM - C_master: Do it for the other line as well
				6:43 PM - C_master: Now, you now know both their line equations, and you know that they mut intercect, therefore both y's are equal
				6:44 PM - C_master: so since, y1 = m1x1+b1, and y2 = m2x2 + b2, and y1 = y2, and x1 = x2 then
				6:44 PM - C_master: m2x + b2 = m1x + b1
				6:44 PM - C_master: You can figure out EXACTLY where they intercent
				6:44 PM - C_master: once you find what X is in there, you can use one of those equations to find the y
				6:45 PM - C_master: THen you have the x, y coordinate of where those 2 straight lines intercect
				6:45 PM - C_master: Once you got that, you know where the lazer must end
				6:45 PM - C_master: Simple as pie

				 */
			},
			noCollide: function(bullet) {
				bullet.width = bullet.maxWidth;
			}
		}
	};

	function randomWeapon() {
		var index = helper.randomFromInterval(0, weaponList.length - 1);
		return weaponList[index];
	}

	function color(tank) {
		if (weapons[tank]) {
			return weapons[tank].color;
		} else if (tank && tank.weaponName) {
			return weapons[tank.weaponName].color;
		}
	}

	function changeWeapon() {
		tanks.forEach(function(tank, index, tankList) {
			var weapon = randomWeapon();
			var command = commands.newCommand(tank.remoteId, tank.ping, time.now() + 50, "changeWeapon", weapon);
			messages.newMessage("newCommand", io.sockets, tank.remoteId, tank.ping, time.now() + 50, "changeWeapon", weapon);
			commands.push(command);
			messages.sendNow();
		});
	}

	function definition(weaponName) {
		return weapons[weaponName];
	}
	return {
		changeWeapon: changeWeapon,
		randomWeapon: randomWeapon,
		color: color,
		definition: definition
	};
}());
if (typeof module !== "undefined") {
	module.exports = weapons;
}