var time = (function() {
	var serverTime = Date.now();
	var lastServerTimeSync = window.performance.now();

	function now() {
		var offset = window.performance.now()-lastServerTimeSync;
		return serverTime+offset;
	}
	return {
		now:now,
		set serverTime(time) {
			lastServerTimeSync = window.performance.now();
			console.log(time,now());
			serverTime = time;
			console.log(time,now());
		}
	};
}());