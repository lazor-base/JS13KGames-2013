var ui = (function(window, document) {
	var playerTemplate = '<li data-localId="{{localId}}" data-remoteId="{{remoteId}}">Player ID: <span class="localId">{{localId}}</span> | Controller Id: <span class="controllerId">{{controllerId}}</span> | Remote Id: <span class="remoteId">{{remoteId}}</span> | Ping: <span class="ping">{{ping}}</span> | X: <span class="x">{{x}}</span> | Y: <span class="y">{{y}}</span></li>';

	function createElement(name) {
		return document.createElement(name);
	}

	function setAttribute(element, nameValueList, value) {
		if (value) {
			element.setAttribute(nameValueList, value);
		} else {
			for (var i = 0; i < nameValueList.length; i += 2) {
				element.setAttribute(nameValueList[i], nameValueList[i + 1]);
			}
		}
	}

	function get(nodeId) {
		return document.getElementById(nodeId);
	}

	function ready(fn) {
		document.addEventListener("DOMContentLoaded", fn);
	}

	function getLocalPlayer(localId) {
		return getPlayer(localId, "localId");
	}

	function getRemotePlayer(remoteId) {
		// console.log(remoteId)
		return getPlayer(remoteId, "remoteId");
	}

	function getPlayer(id, type) {
		return document.querySelector('li[data-' + type + '="' + id + '"]');
	}

	function addLocalPlayer(localId, controllerId, remoteId, ping) {
		addPlayer(localId, controllerId, remoteId, ping, "localPlayers");
	}

	function addRemotePlayer(remoteId, ping) {
		addPlayer(-1, -1, remoteId, ping, "remotePlayers");
	}

	function addPlayer(localId, controllerId, remoteId, ping, target) {
		var found = false;
		var result = ["remoteId", remoteId, "ping", ping];
		if (localId === -1) {
			found = getRemotePlayer(remoteId);
		} else {
			result.push("controllerId", controllerId);
			found = getLocalPlayer(localId);
		}
		if (found) {
			changePlayer(found, result);
		} else {
			var result = template(playerTemplate, {
				localId: localId,
				controllerId: controllerId,
				remoteId: remoteId,
				x: 0,
				y: 0,
				ping: ping
			});
			var parent = get(target);
			parent.innerHTML += result;
		}
	}

	function remove(node) {
		node.parentNode.removeChild(node);
	}

	function changePlayer(player, property, value) {
		function handleRemoteId(property, value) {
			if (property === "remoteId") {
				player.dataset.remoteid = value;
			}
		}
		if (player !== null) {
			if (typeof value !== "undefined") {
				handleRemoteId(property, value);
				player.querySelector('span[class="' + property + '"]').textContent = value;
			} else {
				for (var i = 0; i < property.length; i += 2) {
					handleRemoteId(property[i], property[i + 1]);
					player.querySelector('span[class="' + property[i] + '"]').textContent = property[i + 1];
				}
			}
		}
	}

	function template(template, vars) {
		var result = template;
		for (var attr in vars) {
			result = result.replace(new RegExp("{{" + attr + "}}", 'g'), vars[attr]);
		}
		return result;
	}

	return {
		createElement: createElement,
		setAttribute: setAttribute,
		getLocalPlayer: getLocalPlayer,
		getRemotePlayer: getRemotePlayer,
		addLocalPlayer: addLocalPlayer,
		addRemotePlayer: addRemotePlayer,
		addPlayer: addPlayer,
		changePlayer: changePlayer,
		remove: remove,
		get: get,
		ready: ready
	};
}(window, document));