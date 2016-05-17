'use strict';

var path = require('path');
var metalsmith = require('metalsmith');

// Metalsmith modules
var markdown = require('metalsmith-markdown');

var build = function(root, options, callback) {

	//var source = path.join(root, 'source');
	//var dest = path.join(root, 'dest');
	var metadata = {};
	if (options.hasOwnProperty('metadata'))
		metadata = options.metadata;

	//console.log("building site at %s", source);

	metalsmith(root)
	.metadata(metadata)
	.source('source')
	.destination('public')
	.use(markdown())
	.build(function(err) {
		if (err) { console.error(err); }
		callback && callback(err);
	});
};

module.exports = build;