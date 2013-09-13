var score = (function() {
	var scores = {};

	function modifyScore(bullet, tank) {
		bullet.source.currentScore += bullet.damage;
		if (tank.health - bullet.damage <= 0) {
			// if they are from the same pc, give them less rewards
			if (bullet.source.socketId === tank.socketId) {
				bullet.source.currentScore += tank.currentScore - (tank.currentScore / 8);
			} else {
				bullet.source.currentScore += tank.currentScore - (tank.currentScore / 4);
			}
			tank.currentScore = tank.currentScore - (tank.currentScore / 4);
		}
		console.log(bullet.source.currentScore, tank.currentScore, scores)
		scores[tank.socketId + "" + tank.remoteId] = tank.currentScore;
		scores[bullet.source.socketId + "" + bullet.source.remoteId] = bullet.source.currentScore;
	}

	function saveToDisk() {
		var path = require('path');
		var fs = require("fs");

		var data = JSON.stringify(scores);
		var file = path.join(__dirname, "scores.json");
		fs.writeFileSync(file, data);
	}

	function loadFromDisk() {
		var fs = require("fs");
		var path = require("path");
		fs.readFile(path.join(__dirname, "scores.json"), 'utf8', function read(err, data) {
			if (err) {
				// file doesnt yet exist
				saveToDisk();
			} else {
				scores = JSON.parse(data);
			}
		});
	}

	function get(callback) {
		function callback_function(object) {
			// `object' contains the parsed JSON object
		}

		var xhr = new XMLHttpRequest();
		xhr.open("GET", "scores.json", true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				callback(JSON.parse(xhr.responseText));
			}
		}
		xhr.send();
	}

	function listEntries(scoreList, callback) {
		console.log(scoreList)
		for (var i = 0; i < scoreList.length; i++) {
			console.log(scoreList[i])
			callback(scoreList[i].name, scoreList[i].score);
		}
	}

	function sort(field, reverse, primer) {
		var key = function(x) {
			return primer ? primer(x[field]) : x[field]
		};

		return function(a, b) {
			var A = key(a),
				B = key(b);
			return ((A < B) ? -1 : (A > B) ? +1 : 0) * [-1, 1][+ !! reverse];
		}
	}

	function highest(entries) {
		var scores = [];
		for (var attr in entries) {
			scores.push({
				name: attr,
				score: entries[attr]
			});
		}
		scores = scores.sort(sort('score', true, parseInt));
		return scores;
	}
	return {
		highest: highest,
		listEntries: listEntries,
		get: get,
		loadFromDisk: loadFromDisk,
		saveToDisk: saveToDisk,
		modifyScore: modifyScore
	};
}());
if (typeof module !== "undefined") {
	module.exports = score;
}