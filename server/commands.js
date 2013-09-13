var commands = (function() {
	var commandList = [];
	var history = [];
	var executeListeners = [];
	var lastTimeStamp = 0;

	function forEach(fn) {
		for (var i = 0; i < commandList.length; i++) {
			fn(commandList[i], i, commandList);
		}
	}

	function process(deltaTime) {
		lastTimeStamp = 0;
		forEach(function(command, index, commandList) {
			if (command.timeStamp > lastTimeStamp) {
				execute(command, false, deltaTime);
			} else {
				history.push(helper.removeFromArray(commandList, command)); // discard outdated commands
			}
		});
	}

	function newCommand(remoteId, ping, timeStamp, action, value) {
		if (history.length > 0) {
			var command = helper.removeFromArrayAtIndex(history);
		} else {
			var command = {};
		}
		command.remoteId = remoteId;
		command.ping = ping;
		command.timeStamp = timeStamp;
		command.action = action;
		command.value = value;
		return command;
	}

	function execute(command, notYetPushed, deltaTime) {
		// console.log("executing command", command.timeStamp - time.now())
		if (time.now() >= command.timeStamp) {
			for (var i = 0; i < executeListeners.length; i++) {
				lastTimeStamp = command.timeStamp;
				executeListeners[i](command, deltaTime, time.now() - command.timeStamp);
			}
			if (!notYetPushed) {
				history.push(helper.removeFromArray(commandList, command));
			}
		} else {
			return false;
		}
	}

	function push(command) {
		if (execute(command, true, 0) === false) {
			commandList.push(command);
			return true;
		}
	}

	function onExecute(fn) {
		executeListeners.push(fn);
	}

	return {
		forEach: forEach,
		process: process,
		onExecute: onExecute,
		newCommand: newCommand,
		get length() {
			return commandList.length;
		},
		push: push
	};
}());
if (typeof module !== "undefined") {
	module.exports = commands;
}