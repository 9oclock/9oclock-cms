'use strict';

var fs = require('fs');
var path = require('path');
var dispatch = require('dispatchjs');
var tiptoe = require('tiptoe');
var async = require('async');
var build = require('./builder');

var config = {};
var defaultSiteSettings = {
	"url": "",
	"title": "New Site",
	"default-author": "Admin",
	"layout": "default"
};

function getPostsForSite(siteName, callback) {
	var postsPath = path.join(config['data'], 'sites', siteName, 'source', '_posts');

	var answer = {};

	fs.readdir(postsPath, function(err, files) {
		if (err) {
			console.error(err);
			answer = {
				"success": false,
				"error": err
			};
			return(setImmediate(callback, answer));
		}

		answer = {
			"success": true,
			"posts": []
		};
		async.eachSeries(files, function(fn, cb) {
			fs.readFile(path.join(postsPath, fn), 'utf-8', function(err, data) {
				var obj = { "post": fn, "contents": data };
				answer.posts.push(obj);
				cb();
			});
		},
		function() {
			setImmediate(callback, answer);
		});
	});
}

/**
 * Retrieves the site information
 * Callback in the format function(err, siteInfo)
 */
function getSiteInfo(siteName, callback) {
	fs.readFile(path.join(config['data'], 'sites', siteName, 'site.json'), 'utf-8', function(err, data) {
		if (err) {
			callback && callback(err);
			return;
		}

		callback && callback(null, JSON.parse(data));
	});
}

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

	getSiteInfo(siteName, function(err, siteInfo) {
		if (err)
			self(JSON.stringify({ "success": false, "error": "Requested site does not exists.", "request": self.matches[0] }), { 'Content-Type': 'application/json'});
		else
			self(JSON.stringify(siteInfo), { 'Content-Type': 'application/json'});
	});
});

dispatch.map('POST', '/site/posts/([^/]*)/save', function(req, res) {
	var siteName = this.matches[1];
	var self = this;

	var finish = function(data) {
		self(JSON.stringify(data), { 'Content-Type': 'application/json'});
	};

	console.log("saving post for %s:", siteName);
	var oldFN = this.fields.post['oldfilename'];
	var filename = this.fields.post['filename'];
	var contents = this.fields.post['contents'];

	var postsPath = path.join(config['data'], 'sites', siteName, 'source', '_posts');

	if (oldFN == '') {
		// New Post
		fs.stat(path.join(postsPath, filename), function(err, stats) {
			if (!err) {
				finish({ success: false, error: "File already exists" });
				return;
			}
			fs.writeFile(path.join(postsPath, filename), contents, 'utf-8', function(err) {
				if (err) {
					finish({ success: false, error: err });
					return;
				}

				var obj = {
					success: true,
					"post": filename,
					"contents": contents
				};
				finish(obj);
			});
		});
	}
	else if (oldFN != filename) {
		// Rename Post
		fs.stat(path.join(postsPath, filename), function(err, stats) {
			if (!err) {
				finish({ success: false, error: "File already exists" });
				return;
			}

			// Save post
			fs.writeFile(path.join(postsPath, filename), contents, 'utf-8', function(err) {
				if (err) {
					finish({ success: false, error: err });
					return;
				}

				var obj = {
					"success": true,
					"post": filename,
					"contents": contents,
					"removed": oldFN
				};

				// Remove old post
				fs.unlink(path.join(postsPath, oldFN));

				finish(obj);
			});
		});
	}
	else {
		// Just save post
		fs.writeFile(path.join(postsPath, filename), contents, 'utf-8', function(err) {
			if (err) {
				finish({ success: false, error: err });
				return;
			}

			var obj = {
				success: true,
				"post": filename,
				"contents": contents
			};
			finish(obj);
		});
	}
});

dispatch.map('GET', '/site/posts/([^/]*)', function(req, res) {
	var self = this;

	getPostsForSite(this.matches[1], function(answer) {
		self(JSON.stringify(answer), { 'Content-Type': 'application/json'});
	});
});

dispatch.map('GET', '/site/build/([^/]*)', function(req, res) {
	var self = this;
	var siteName = this.matches[1];

	getSiteInfo(siteName, function(err, siteInfo) {
		if (err) {
			self(JSON.stringify({ success: false, error: err }), { 'Content-Type': 'application/json'});
			return;
		}
		var rootDir = path.join(config['data'], 'sites', siteName);
		siteInfo.templatePath = path.join(config['data'], 'themes', 'default');

		build(rootDir, siteInfo, function(err) {
			if (err)
				self(JSON.stringify({ success: false, error: err }), { 'Content-Type': 'application/json'});
			else
				self(JSON.stringify({ success: true }), { 'Content-Type': 'application/json'});
		});
	});
});

dispatch.map('POST', '/site/new$', function(req, res) {
	// TODO: Validate post data.
	var siteName = this.fields.siteName;
	console.log("Trying to create site: %s", siteName);
	var self = this;

	var siteRoot = path.join(config['data'], 'sites', siteName);

	fs.stat(siteRoot, function(err, stats){
		if (!err) {
			var answer = { "success": false, "error": "Requested new site already exists.", "request": self.matches[0] };
			self(JSON.stringify(answer), { 'Content-Type': 'application/json'});
			return;
		}

		/*
			Create site structure:
			...
			data
			+ sites
			+ + siteName
			+ + - public
			+ + + source
			+ + + - _posts
			+ + + - _img
			+ + - site.json (json file, not directory)
		*/

		tiptoe(
			function() {
				fs.mkdir(siteRoot, this);
			},
			function() {
				fs.mkdir(path.join(siteRoot, 'public'), this.parallel());
				fs.mkdir(path.join(siteRoot, 'source'), this.parallel());
			},
			function() {
				fs.mkdir(path.join(siteRoot, 'source', '_posts'), this.parallel());
				fs.mkdir(path.join(siteRoot, 'source', 'img'), this.parallel());

				var siteSettings = JSON.parse(JSON.stringify(defaultSiteSettings));
				siteSettings.url = siteName;

				fs.writeFile(path.join(siteRoot, 'site.json'), JSON.stringify(siteSettings), 'utf-8', this);
			},
			function(err) {
				if (err) { console.error(err); throw(err); }
				self(JSON.stringify({ "success": true, "siteName": siteName }), { 'Content-Type': 'application/json'});
				console.log("Creation of %s finished.", siteName);
			}
		);
	});
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
