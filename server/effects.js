var effects = (function() {
	var oldEffects = [];
	var oldParticles = [];
	var effectList = [];

	var vfx = {
		spawn: {

		}
	};

	function getDimention(axis, particle) {
		if (axis === "x") {
			var dimention = "width";
		} else {
			var dimention = "height";
		}
		return (particle[dimention] / 2) + (particle.distance / 2);
	}

	function changePosition(axis, position, angle, particle) {
		var x = getDimention("x", particle);
		var y = getDimention("y", particle);
		if (axis === "x") {
			var math = "cos";
		} else {
			var math = "sin";
		}
		return position + (x + y) * Math[math](angle * (Math.PI / 180));
	}

	function damageEffect(bullet, target) {

		function directionModifier(particle, effect, index) {
			particle.angle = particle.angle + helper.randomFromInterval(-30, 30);
		}
		var numberOfParticles = bullet.damage;
		var effect = create(target.id + ("" + Math.random()), bullet.x, bullet.y, numberOfParticles, 150, 50, bullet.angle - 180, 0, "black", null, directionModifier, null, null, null);
	}

	function deathEffect(tank) {
		function directionModifier(particle, effect, index) {
			particle.angle = particle.angle + helper.randomFromInterval(0, 359);
			particle.color = weapons.color(weapons.randomWeapon());
		}

		function onCollision(particle, tank) {
			create(particle.id + ("" + Math.random()), particle.x, particle.y, 1, 75, 50, particle.angle - 180, 0, particle.color, null, null, null, null, null);
			destroy(particle);
		}

		var numberOfParticles = 20;
		var effect = create(tank.id + ("" + Math.random()), tank.x, tank.y, numberOfParticles, 150, 100, tank.angle - 180, 0, "red", null, directionModifier, onCollision, null, null);
	}

	function spawnEffect(tank) {
		function frameModifier(particle) {
			particle.x -= particle.xSpeed * 2;
			particle.y -= particle.ySpeed * 2;
		}

		function directionModifier(particle, effect, index) {
			var maxAngle = 180;
			particle.angle = particle.angle + (-maxAngle + index * (maxAngle * 2 / (effect.number - 1)));
			particle.x = changePosition("x", particle.x, particle.angle, particle);
			particle.y = changePosition("y", particle.y, particle.angle, particle);
			return particle;
		}

		function onCollision(particle, tank) {
			if (tank.health) {
				tank.health -= particle.source.damage;
				tanks.death(tank);
				destroy(particle);
			}
		}

		function onComplete(effect) {
			tank.spawned = true;
			tank.health = effect.particles.length * effect.damage;
			tanks.syncTank(tank, 0, "spawned", tank.spawned);
		}
		var numberOfParticles = 10;
		var effect = create(tank.socketId, tank.x, tank.y, numberOfParticles, 150, 100, 360 - tank.angle, tank.health / numberOfParticles, "red", frameModifier, directionModifier, onCollision, onComplete, null);
	}

	function create(id, x, y, numberOfParticles, speed, distance, angle, damage, color, frameModifier, directionModifier, onCollision, onComplete, onStart) {
		if (oldEffects.length > 0) {
			var effect = helper.removeFromArrayAtIndex(oldEffects);
		} else {
			var effect = {};
		}
		if (effect.particles) {
			while (effect.particles.length) {
				oldParticles.push(helper.removeFromArrayAtIndex(effect.particles)); // store old particles for reuse
			}
		} else {
			effect.particles = [];
		}
		effect.id = id;
		effect.x = x;
		effect.y = y;
		effect.damage = damage;
		effect.number = numberOfParticles;
		effect.frameModifier = frameModifier;
		effect.onCollision = onCollision;
		effect.onComplete = onComplete;
		effect.onStart = onStart;
		for (var i = 0; i < numberOfParticles; i++) {
			var particle = newParticle(x, y, speed, distance, angle, color, effect, i);
			if (typeof directionModifier === "function") {
				directionModifier(particle, effect, i);
			}
			effect.particles.push(particle);
		}
		effectList.push(effect);
	}

	function newParticle(x, y, speed, distance, angle, color, source, index) {
		if (oldParticles.length > 0) {
			var particle = helper.removeFromArrayAtIndex(oldParticles);
		} else {
			var particle = {};
		}
		particle.id = index;
		particle.remainder = 0;
		particle.deltaTime = 0;
		particle.startTime = time.now();
		particle.source = source;
		particle.x = x;
		particle.y = y;
		particle.width = 5;
		particle.height = 5;
		particle.ySpeed = 0;
		particle.xSpeed = 0;
		particle.speed = speed;
		particle.distance = distance;
		particle.angle = angle;
		particle.color = color;
		particle.currentDistance = 0;
		if (!particle.points) { // old points are just objects of x and y, and there is no need to replace those
			particle.points = [];
		}
		return particle;
	}

	function forEach(fn) {
		for (var i = 0; i < effectList.length; i++) {
			fn(effectList[i], i, effectList);
		}
	}

	function processEffects(deltaTime) {
		forEach(function(effect, index, effectList) {
			for (var i = 0; i < effect.particles.length; i++) {
				processMove(effect.particles[i], deltaTime);
			}
		});
		forEach(function(effect, index, effectList) {
			if (typeof effect.onCollision === "function") {
				for (var i = 0; i < effect.particles.length; i++) {
					if (effect.particles[i]) {
						tanks.forEach(function(tank, index, tankList) {
							if (effect.particles[i]) {
								if (tank.spawned) {
									var result = physics.parse(effect.particles[i], tank);
									if (result) {
										effect.onCollision(effect.particles[i], tank);
										// tanks.hurt(bullet, tank, result);
									} else {
										// bullets.noCollide(bullet);
									}
								}
							}
						});
					}
					if (effect.particles[i]) {
						map.forEach(function(wall, index, walls) {
							if (effect.particles[i]) {
								var result = physics.parse(effect.particles[i], wall);
								if (result) {
									effect.onCollision(effect.particles[i], wall);
									// tanks.hurt(bullet, wall, result);
								} else {
									// bullets.noCollide(bullet);
								}
							}
						});
					}
				}
			}
		});
	}

	function processMove(particle, deltaTime) {
		particle.deltaTime = deltaTime;
		if (typeof particle.source.frameModifier === "function") {
			particle.source.frameModifier(particle);
		}
		var MAX_SPEED = particle.speed * (deltaTime / 1000);
		var turnAngle = particle.angle;
		var reverse = turnAngle;
		turnAngle = Math.abs(turnAngle) % 360;
		if (reverse < 0) {
			turnAngle = 360 - turnAngle;
		}
		var xSpeed = particle.xSpeed = MAX_SPEED * Math.cos(turnAngle * Math.PI / 180);
		var ySpeed = particle.ySpeed = MAX_SPEED * Math.sin(turnAngle * Math.PI / 180);
		particle.currentDistance += Math.sqrt((xSpeed * xSpeed) + (ySpeed * ySpeed));
		particle.x += xSpeed;
		particle.y += ySpeed;
		// remove bullet if it goes off screen
		if (particle.currentDistance >= particle.distance || (particle.duration && particle.duration < time.now() - particle.startTime)) {
			// effect complete, trigger the complete event and destroy the effect
			if (typeof particle.source.onComplete === "function") {
				particle.source.onComplete(particle.source);
			}
			forEach(function(effect, index, effectList) {
				if (effect.id === particle.source.id) {
					if (effect.particles) {
						while (effect.particles.length) {
							oldParticles.push(helper.removeFromArrayAtIndex(effect.particles)); // store old particles for reuse
						}
					}
					oldEffects.push(helper.removeFromArrayAtIndex(effectList, index));
				}
			});
		}
	}

	function destroy(particle) {
		for (var i = 0; i < particle.source.particles.length; i++) {
			if (particle.source.particles[i].id === particle.id) {
				oldParticles.push(helper.removeFromArrayAtIndex(particle.source.particles, i));
				return true;
			}
		}
	}


	return {
		create: create,
		processEffects: processEffects,
		spawnEffect: spawnEffect,
		damageEffect: damageEffect,
		forEach: forEach,
		deathEffect: deathEffect,
		get oldParticles() {
			return oldParticles;
		},
		get oldEffects() {
			return oldEffects;
		},
	};
}());
if (typeof module !== "undefined") {
	module.exports = effects;
}