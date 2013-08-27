var commands = (function() {
	var commandList = [];
	var history = [];
	var executeListeners = [];

	function forEach(fn) {
		for (var i = 0; i < commandList.length; i++) {
			fn(commandList[i], i, commandList);
		}
	}

	function process(deltaTime) {
		forEach(function(command, index, commandList) {
			execute(command, false, deltaTime);
		});
	}

	function execute(command, notYetPushed, deltaTime) {
		if (time.now() >= command.timeStamp) {
			for (var i = 0; i < executeListeners.length; i++) {
				executeListeners[i](command, deltaTime);
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