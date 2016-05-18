'use strict';

var lib = require('./lib');

var terminal = {
	'build': function(sitename) {
		console.log('building %s', sitename);
		
		// TODO: Check if site exists.
		lib.build(sitename, function(err) {
			if (err) throw(err);

			console.log('done.');
		});
	},
	'help': function() {
		console.log("Valid commands:");
		console.log(" * help");
		console.log(" * build <sitename>");
	}
};

lib.loadConfig(function(res) {
	var commands = Array.prototype.slice.call(process.argv, 2);

	var cmd = 'help';
	if (commands.length > 0) {
		cmd = commands.shift();
	}

	if (!terminal.hasOwnProperty(cmd)) {
		cmd = 'help';
	}

	terminal[cmd].apply(null, commands);
});