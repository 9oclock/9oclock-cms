'use strict';

var path = require('path');
var metalsmith = require('metalsmith');
var moment = require('moment');

// Metalsmith modules
var markdown = require('metalsmith-markdown');
var collections = require('metalsmith-collections');
var layouts = require('metalsmith-layouts');

// Using forked repo
var permalinks = require('metalsmith-permalinks');
var blog = require('metalsmith-blog');

var build = function(root, options, callback) {

	var metadata = {};
	if (options.hasOwnProperty('metadata'))
		metadata = options.metadata;

	var template_dir = options.templatePath || __dirname;
	if (template_dir[0] != '.' && template_dir[0] != '/')
		template_dir = path.join(__dirname, '..', template_dir);

	if (options.layout)
		template_dir = path.join(template_dir, options.layout);

	console.log("Using template at '%s'", template_dir);

	var collections_settings = {
		post: {
			pattern: '_posts/*.md'
		},
		page: {
			pattern: '*.md'
		}
	};

	var permalink_settings = {
		pattern: ':title',
		date: 'YYYY-MM-DD',
		relative: false,
		linksets: [
			{
				match: {
					collection: 'post'
				},
				pattern: ':date/:slug',
				date: 'YYYY/MM'
			},
			{
				match: {
					collection: 'page',
				},
				pattern: ':slug',
				date: 'YYYY/MM'
			},
			{
				match: {
					collection: 'pagination'
				},
				pattern: ':slug',
				date: 'YYYY/MM'
			}
		]
	};

	var layouts_settings = {
		engine: 'pug',
		directory: template_dir,
		pretty: true,
		moment: moment
	};

	//console.log("building site at %s", source);

	metalsmith(root)
	.metadata(metadata)
	.source('source')
	.destination('public')
	.use(collections(collections_settings))
	.use(markdown())
	.use(permalinks(permalink_settings))
	.use(blog())
	.use(blog.categories())
	.use(blog.tags())
	.use(layouts(layouts_settings))
	.build(function(err) {
		if (err) { console.error(err); }
		callback && callback(err);
	});
};

module.exports = build;