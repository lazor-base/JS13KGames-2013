var messages = (function() {
	var messagePool = {};
	var targets = {};
	var oldMessages = [];
	var arrays = [];
	var lastMessage = [];
	var lastPost = time.now();
	var isNode = false;
	var bytesSent = 0;
	var bytesReceived = 0;
	var dictionary = ["disconnectUser", "addUser", "input", "userAdded", "sendServerTime", "gamePlayers", "syncMap", "newPlayer", "newCommand", "disconnects", "replaceTank", "cannon", "spread", "flame", "laser"];
	var messageDictionary = {
		NAME:0,
		DATA:1,
		ENCODED:2
	};
	if (typeof global !== "undefined") {
		isNode = true;
	}
	// http://stackoverflow.com/a/6182519/661939

	function toBase64(string) {
		if (isNode) {
			return new Buffer(string).toString('base64');
		} else {
			return btoa(string);
		}
	}

	function toString(base64) {
		if (isNode) {
			return new Buffer(base64, 'base64').toString('ascii');
		} else {
			return atob(base64);
		}
	}

	function encode(key, args) {
		var argList = JSON.stringify(args);
		if (arrays.length > 0) {
			var list = helper.removeFromArrayAtIndex(arrays);
			list.length = 0;
		} else {
			var list = [];
		}
		for (var i = 0; i < args.length; i++) {
			if (typeof args[i] === "string") {
				list[i] = args[i];
			} else {
				list[i] = JSON.stringify(args[i]);
			}
		}
		var result1 = [].join.call(list, key);
		var result2 = toBase64(result1);
		arrays.push(list);
		var result = [];
		if(argList.length < result2.length && argList.length < result1.length) {
			result.push(argList,false);
		}
		if(result2.length < argList.length && result2.length < result1.length) {
			result.push(result2,true);
		}
		if(result1.length < result2.length && result1.length < argList.length) {
			result.push(result1,false);
		}
		if(key === "~") {
			bytesSent += result[0].length;
			// console.log("sent:",bytesSent);
		}
		return result;

	}

	function decode(string, key, callback, encoded) {
		if (encoded === false || string.charAt(0) === "{" || string.charAt(0) === "[" || string.indexOf("`") >-1|| string.indexOf(key)>-1) {
			var result = string;
		} else {
			var result = toString(string);
		}
		result = result.split(key);
		for (var i = 0; i < result.length; i++) {
			try {
				result[i] = JSON.parse(result[i]);
			} catch (e) {}
		}
		if(key === "~") {
			bytesReceived += string.length;
			// console.log("received:",bytesReceived);
		}
		callback(result);
	}

	function use(fn, args) {
		if (typeof fn === "function") {
			fn.apply(null, args);
		}
	}

	function newMessage(name, target) {
		var id = target.id
		if (!messagePool[id]) {
			messagePool[id] = [];
			targets[id] = target;
		}
		if (oldMessages.length > 0) {
			var message = helper.removeFromArrayAtIndex(oldMessages);
		} else {
			var message = [];
		}
		message[messageDictionary.NAME] = dictionary.indexOf(name);
		[].splice.call(arguments, 0, 2); // remove the name and target
		var result = encode("`", arguments);
		message[messageDictionary.DATA] = result[0];
		message[messageDictionary.ENCODED] = result[1];
		messagePool[id].push(message);
	}

	function parse(incoming, sendTime, source) {
		// console.log("receiving data: ", incoming, time.now());
		decode(incoming, "~", function(array) {
			for (var i = 0; i < array.length; i++) {
				var message = array[i];
				decode(message[messageDictionary.DATA], "`", function(data) {
					server.handle(dictionary[message[messageDictionary.NAME]], data, sendTime, source);
				}, message[messageDictionary.ENCODED]);
			}
		});

	}

	function sendMessages() {
		if (time.now() - lastPost >= 50) {
			sendNow();
		}
	}

	function sendNow() {
		for (var id in messagePool) {
			if (messagePool[id].length) {
				targets[id].emit("message", encode("~", messagePool[id])[0], time.now());
				// console.log("sending data: ", encode("`", messagePool[id]), time.now());
			}
			while (messagePool[id].length) {
				oldMessages.push(helper.removeFromArrayAtIndex(messagePool[id]));
			}
		}
	}
	return {
		newMessage: newMessage,
		parse: parse,
		use: use,
		sendNow: sendNow,
		sendMessages: sendMessages
	};
}());
if (typeof module !== "undefined") {
	module.exports = messages;
}