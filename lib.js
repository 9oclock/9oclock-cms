'use strict';

var fs = require('fs');
var path = require('path');
var builder = require('./builder');

var config = {};

var getConfig = function() { return(config); };

var loadConfig = function(callback) {
	fs.readFile(path.join(__dirname, 'config.json'), 'utf-8', function(err, data) {
		if (err) throw(err);
		config = JSON.parse(data);
		callback && callback(config);
	});
};

/**
 * Retrieves the site information
 * Callback in the format function(err, siteInfo)
 */
var getSiteInfo = function(siteName, callback) {
	fs.readFile(path.join(config['data'], 'sites', siteName, 'site.json'), 'utf-8', function(err, data) {
		if (err) {
			callback && callback(err);
			return;
		}

		callback && callback(null, JSON.parse(data));
	});
};

var build = function(siteName, callback) {
	getSiteInfo(siteName, function(err, siteInfo) {
		if (err) {
			callback && callback(err);
		}

		var rootDir = path.join(config['data'], 'sites', siteName);
		siteInfo.templatePath = path.join(config['data'], 'themes');

		builder(rootDir, siteInfo, function(err) {
			callback && callback(err);
		});
	});
};

// Export stuff
module.exports.loadConfig = loadConfig;
module.exports.getConfig = getConfig;
module.exports.getSiteInfo = getSiteInfo;
module.exports.build = build;
