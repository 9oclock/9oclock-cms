'use strict';

var path = require('path');
var metalsmith = require('metalsmith');

// Metalsmith modules
var markdown = require('metalsmith-markdown');
var collections = require('metalsmith-collections');

// Using forked repo
var permalinks = require('metalsmith-permalinks');
var blog = require('metalsmith-blog');

var build = function(root, options, callback) {

	var metadata = {};
	if (options.hasOwnProperty('metadata'))
		metadata = options.metadata;

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
	.use()
	.build(function(err) {
		if (err) { console.error(err); }
		callback && callback(err);
	});
};

module.exports = build;