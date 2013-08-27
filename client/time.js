var time = (function() {
	var serverTime = Date.now();
	var lastServerTimeSync = window.performance.now();
	var timeDifference = 0;

	function now() {
		return Date.now()-timeDifference;
	}
	function parse(localTime, difference, serverReply, callback) {
		var roundTripTime = Date.now()-localTime;
		var responseTime = roundTripTime-difference;
		timeDifference = responseTime;
		if(typeof callback === "function") {
			callback();
		}
	}
	return {
		now:now,
		parse:parse,
		set serverTime(time) {
			lastServerTimeSync = window.performance.now();
			serverTime = time;
		}
	};
}());