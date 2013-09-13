var map = (function() {
	var walls = [];
	var map;

	//create a maze based off python growing tree algorithm at http://pcg.wdfiles.com/local--files/pcg-algorithm:maze/growingtree.py
	//returns field, an array of said size

	function createMaze(x, y, rows, cols) {
		//the grid of the maze
		// # is wall  . is empty space  , is exposed but undertemined  ? is unexposed and undertermined
		field = [];
		mazeH = rows;
		mazeW = cols;

		// debug("Creating a " + cols + " by " + cols + " big maze");

		//populate grid with ?'s
		for (var i = 0; i < rows; i++) {
			var row = [];
			for (var ii = 0; ii < cols; ii++) {
				row.push('?');
			}
			field.push(row);
		}


		//list of coordinates of exposed but undetermined cells
		frontier = [];

		//choose random starting point
		var xchoice = Math.floor(Math.random() * cols);
		var ychoice = Math.floor(Math.random() * rows);
		// debug("starting at " + xchoice + "," + ychoice);

		carve([ychoice, xchoice]);

		//parameter branchrate:
		//zero is unbiased, positive will make branches more frequent, negative will cause long passages
		//this controls the position in the list chosen: positive makes the start of the list more likely,
		//negative makes the end of the list more likely
		//large negative values make the original point obvious
		//try values between -10, 10
		var branchrate = 0;

		// debug("Starting main loop. Frontier is " + frontier.length + " long");

		//NOTE: this might be horribly broken. Not sure what that pos code does or if it works in JS and choice is supposed to be passed via ref


		while (frontier.length > 0) {
			var pos = Math.random();
			pos = Math.pow(pos, Math.pow(Math.E, -branchrate));
			var rpos = Math.floor(pos * frontier.length);
			var choice = frontier[rpos];
			// debug("frontier: " + frontier.length + " - rpos: " + rpos + " - choice: " + choice);
			if (check(choice)) {
				// debug("Carve: " + choice);
				carve(choice);
			} else {
				//debug("Harden: "+choice);
				harden(choice);
			}
			frontier.splice(rpos, 1);
		}

		for (var iy = 0; iy < rows; iy++) {
			for (var ix = y; ix < cols; ix++) {
				if (field[y][x] == '?') {
					field[y][x] = '#';
				}
			}
		}


		//Done??? return it
		return field;
	}

	//make a cell at y,x a space

	function carve(posi) {
		var y = posi[0];
		var x = posi[1];
		// debug("Carve: " + field.length + " - " + frontier.length + " at " + y + "," + x);
		var extra = new Array();
		field[y][x] = '.';
		if (x > 0) {
			if (field[y][x - 1] == '?') {
				field[y][x - 1] = ',';
				extra.push(new Array(y, x - 1));
			}
		}
		if (x < mazeW - 1) {
			if (field[y][x + 1] == '?') {
				field[y][x + 1] = ',';
				extra.push(new Array(y, x + 1));
			}
		}
		if (y > 0) {
			if (field[y - 1][x] == '?') {
				field[y - 1][x] = ',';
				extra.push(new Array(y - 1, x));
			}
		}
		if (y < mazeH - 1) {
			if (field[y + 1][x] == '?') {
				field[y + 1][x] = ',';
				extra.push(new Array(y + 1, x));
			}
		}
		//debug("extra length: "+extra.length+" : "+extra);
		extra = shuffle(extra);
		frontier = frontier.concat(extra);
	}

	//make the cell at y,x a wall

	function harden(posi) {
		var y = posi[0];
		var x = posi[1];
		field[y][x] = '#';
	}

	//test the cell at y,x - can it become a space. false means it becomes a wall

	function check(posi) {
		var y = posi[0];
		var x = posi[1];
		var nodiagonals = 1; //make the default to check for diagonals
		if (posi[2]) {
			nodiagonals = posi[2];
		}

		// debug("Check: " + posi);

		var edgestate = 0;
		if (x > 0) {
			if (field[y][x - 1] == '.') {
				edgestate += 1;
			}
		}
		if (x < mazeW - 1) {
			if (field[y][x + 1] == '.') {
				edgestate += 2;
			}
		}
		if (y > 0) {
			if (field[y - 1][x] == '.') {
				edgestate += 4;
			}
		}
		if (y < mazeH - 1) {
			if (field[y + 1][x] == '.') {
				edgestate += 8;
			}
		}

		if (nodiagonals) {
			//TODO: a lot of extra checks here to make maze look better
			if (edgestate == 1) {
				if (x < mazeW - 1) {
					if (y > 0) {
						if (field[y - 1][x + 1] == '.') {
							return 0;
						}
					}
					if (y < mazeH - 1) {
						if (field[y + 1][x + 1] == '.') {
							return 0;
						}
					}
					return 1;
				}
			} else if (edgestate == 2) {
				if (x > 0) {
					if (y > 0) {
						if (field[y - 1][x - 1] == '.') {
							return 0;
						}
					}
					if (y < mazeH - 1) {
						if (field[y + 1][x - 1] == '.') {
							return 0;
						}
					}
					return 1;
				}
			} else if (edgestate == 4) {
				if (y < mazeH - 1) {
					if (x > 0) {
						if (field[y + 1][x - 1] == '.') {
							return 0;
						}
					}
					if (x < mazeW - 1) {
						if (field[y + 1][x + 1] == '.') {
							return 0;
						}
					}
					return 1;
				}
			} else if (edgestate == 8) {
				if (y > 0) {
					if (x > 0) {
						if (field[y - 1][x - 1] == '.') {
							return 0;
						}
					}
					if (x < mazeW - 1) {
						if (field[y - 1][x + 1] == '.') {
							return 1;
						}
					}
					return 1;
				}
			}
			return 0;
		} else {
			var diags = new Array(1, 2, 4, 8);
			if (arrayCount(diags, edgestate)) {
				return 1;
			}
			return 0;
		}
	}

	//shuffle function taken from http://snippets.dzone.com/posts/show/849
	//written by Jonas Raoni Soares Silva
	var mazeW;
	var mazeH;
	var field;
	var frontier;

	var shuffle = function(o) { //v1.0
		for (var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
		return o;
	};

	function buildWalls(map) {
		var previousWall;
		for (var y = 0; y < map.length; y++) {
			for (var x = 0; x < map[y].length; x++) {
				if (map[y][x] !== "#") { // if we aren't dealing with a wall, store the wall
					if (previousWall) {
						walls.push(previousWall);
						previousWall = null;
					}
				} else {
					if (previousWall && map[y][x] === "#") {
						if (previousWall.y === (y * 50) + 25) { // the wall is on the same vertical line, we can extend it
							previousWall.x += 25;
							previousWall.width += 50;
						}
					} else if (map[y][x] === "#") {
						// make a new wall at location (should only happen at the start of a segment)
						var wall = create((x * 50) + 25, (y * 50) + 25, 50, 50, 360);
						previousWall = wall;
					}
				}
			}
			// at the end of every segment, store any previous walls. we can't use them in the next y segment
			if (previousWall) {
				walls.push(previousWall);
				previousWall = null;
			}
		}
	}

	function forEach(fn) {
		for (var i = 0; i < walls.length; i++) {
			fn(walls[i], i, walls);
		}
	}

	function syncMap(target) {
		messages.newMessage("syncMap", target || io.sockets, JSON.stringify(map));
	}

	function init() {
		map = createMaze(0, 0, 12, 18);
		buildWalls(map);
		syncMap();
	}

	function emptyTile() {
		var found = false;
		while (found === false) {
			var randomX = helper.randomFromInterval(0, 17);
			var randomY = helper.randomFromInterval(0, 11);
			if (map[randomY][randomX] === ".") {
				found = true;
				return [randomX, randomY];
			}
		}
	}

	function collide() {
		forEach(function(wall, index, walls) {
			bullets.forEach(function(bullet, index, bulletList) {
				var result = physics.parse(wall, bullet);
				if (result) {
					bullets.collide(bullet, wall, result);
				}
			});
			tanks.forEach(function(tank, index, tankList) {
				var result = physics.parse(wall, tank);
				if (result) {
					tank.x = tank.lastX;
					tank.y = tank.lastY;
					tank.angle = tank.lastAngle;
				}
			});
		});
	}

	function create(x, y, width, height, angle) {
		var wall = {};
		wall.id = x + y + width + height + angle;
		wall.x = x || helper.randomFromInterval(50, 850);
		wall.y = y || helper.randomFromInterval(50, 550);
		wall.width = width || helper.randomFromInterval(10, 100);
		wall.height = height || helper.randomFromInterval(10, 100);
		// wall.angle = angle || helper.randomFromInterval(0, 359);
		wall.angle = 0;
		wall.points = [];
		return wall;
	}
	return {
		forEach: forEach,
		create: create,
		init: init,
		collide: collide,
		emptyTile: emptyTile,
		syncMap: syncMap,
		buildWalls: buildWalls,
		createMaze: createMaze,
		get walls() {
			return walls;
		}
	};
}());
if (typeof module !== "undefined") {
	module.exports = map;
}