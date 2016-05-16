'use strict';

var fs = require('fs');
var path = require('path');
var dispatch = require('dispatchjs');

var config = {};

dispatch.setOption('debug', true);

dispatch.map('GET', '/sites$', function() {
	var self = this;

	fs.readdir(path.join(config['data'], 'sites'), function(err, files) {
		var sites = [];
		sites = files;

		self(JSON.stringify(sites), { 'Content-Type': 'application/json'});
	});
});

dispatch.map('GET', '/site/info/([^/]*)', function(req, res) {
	var siteName = this.matches[1];
	var self = this;

	fs.readFile(path.join(config['data'], 'sites', siteName, 'site.json'), 'utf-8', function(err, data) {
		if (err) {
			self(JSON.stringify({ "error": "Requested site does not exists.", "request": self.matches[0] }), { 'Content-Type': 'application/json'});
			return;
		}
		self(data, { 'Content-Type': 'application/json'})
	});
});

dispatch.map('POST', '/site/new$', function(req, res) {
	console.log(this);

	this('{}', { 'Content-Type': 'application/json'});
});

dispatch.map(404, function() {
	this('Not here.', { 'Content-Type': 'text/plain' });
});

function loadConfig(callback) {
	fs.readFile(path.join(__dirname, 'config.json'), 'utf-8', function(err, data) {
		if (err) throw(err);
		config = JSON.parse(data);
		callback && callback();
	});
}

loadConfig(function() {
	dispatch(3000, { serve_static: true });
});
