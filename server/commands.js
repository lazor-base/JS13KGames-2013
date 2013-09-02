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
				history.push(helper.removeFromArray(commandList, command));
			}
		});
	}

	function execute(command, notYetPushed, deltaTime) {
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
		if (execute(command, true) === false) {
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
		push: push
	};
}());
if (typeof module !== "undefined") {
	module.exports = commands;
}