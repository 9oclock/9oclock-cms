/* 9oclock CMS */

function fixedEncodeURI (str) {
    return encodeURI(str).replace(/%5B/g, '[').replace(/%5D/g, ']');
}

function nineoclock_init(jQuery) {
	var nineoclock = {};
	window.nineoclock = nineoclock;

	nineoclock.currentSite = {};

	// Returns a valid date string.
	// TODO: Fix this mess.
	var dateString = function(now) {
		if (!now)
			now = new Date();

		var aux;
		var ret = now.getFullYear();
		ret += '-';

		aux = now.getMonth();
		ret += (aux.length<2?'0':'') + aux;
		ret += '-';

		aux = now.getDate();
		ret += (aux.length<2?'0':'') + aux;
		ret += ' ';

		aux = now.getHours();
		ret += (aux.length<2?'0':'') + aux;
		ret += ':';

		aux = now.getMinutes();
		ret += (aux.length<2?'0':'') + aux;
		ret += ':';

		aux = now.getSeconds();
		ret += (aux.length<2?'0':'') + aux;

		return(ret);
	};

	nineoclock.updateSites = function() {
		jQuery.ajax('/sites').done(updateSiteList);
	};

	nineoclock.loadSite = function(siteName) {
		jQuery('#currentsite').html(siteName);
		nineoclock.currentSite.name = siteName;
		jQuery.ajax('/site/info/' + siteName).done(function(data) {
			console.log(data);
			nineoclock.currentSite.settings = data;

			nineoclock.loadPosts(siteName);
			jQuery('#topactions').show();
			jQuery('#sitetitle').html(siteName);
		});
	};

	nineoclock.displayPosts = function() {
		jQuery('#contents .site-section').hide()
		jQuery('#posts').show()
	};

	nineoclock.loadPosts = function(siteName, callback) {
		jQuery.ajax('/site/posts/' + siteName)
		.done(function(answer) {
			if (answer.hasOwnProperty('success') && answer.success == false) {
				var text = "Error retrieving posts for " + siteName;
				if (answer.hasOwnProperty('error')) text += "\n" + answer.error;
				window.alert(text);
				callback && callback("Cannot load posts.");
				return;
			}

			nineoclock.currentSite.posts = answer.posts;

			jQuery('#posts-table tbody').empty();

			var i;
			for (i = 0; i < nineoclock.currentSite.posts.length; i++) {
				var text = nineoclock.currentSite.posts[i].contents;
				var meta = jsyaml.loadFront(text);
				var postname = nineoclock.currentSite.posts[i].post;
				var line = '<tr class="post-entry" data-postname="' + postname + '">';
				line += '<td>' + meta.title + '</td>';
				line += '<td>' + meta.date + '</td>';
				line += '<td>';
				line += '<span class="glyphicon glyphicon-edit post-edit post-action" data-postname="' + postname + '" data-contents="' + fixedEncodeURI(text) + '"></span> ';
				line += '<span class="glyphicon glyphicon-trash post-delete post-action" data-postname="' + postname + '"></span> ';
				line += '</td>';
				line += '</tr>';
				jQuery('#posts-table tbody').append(line);
			}

			callback && callback();
		});
	};

	nineoclock.deselectSite = function() {
		jQuery('#currentsite').html('-site placeholder-');
		nineoclock.currentSite = {};
		jQuery('#contents .site-section').hide();
		jQuery('#topactions').hide();
	};

	/** Clear the current site selection and populate with new data */
	function updateSiteList(sites) {
		jQuery('#sitelist-dropdown .site-entry').each(function() { jQuery(this).remove() });
		sites.sort().reverse().forEach(function(site) {
			jQuery('#sitelist-dropdown').prepend('<li class="site-entry" data-site="' + site + '"><a href="#">' + site + '</a></li>');
		});
	}

	// Input Events
	jQuery('#post-title').focusout(function() {
		var currentSlug = jQuery('#post-slug').val();
		var currentFn = jQuery('#post-filename').val();

		var val = jQuery('#post-title').val().toLowerCase().replace(/  /g," ").replace(/ /g, '-');

		if (currentSlug == '') {
			jQuery('#post-slug').val(val);
		}
		if (currentFn == '' && val != '') {
			jQuery('#post-filename').val(val + '.md');
		}
	});

	// Listen to clicks
	jQuery('#sitelist-dropdown').on('click', '.site-entry', function(event) {
		var siteName = jQuery(this).data('site');
		nineoclock.loadSite(siteName);
	});

	jQuery('#sitelist-reload').on('click', function(event) {
		nineoclock.updateSites();
	});

	jQuery('#sitelist-new').on('click', function(event) {
		var siteName = window.prompt("Enter the new site domain");
		if (siteName == null || siteName == "") return;

		jQuery.ajax({ 'url': '/site/new', 'method': 'POST', 'data': { "siteName": siteName } })
		.done(function(msg) {
			console.log(msg);
			if (msg.hasOwnProperty('success') && msg.success != true) {
				var text = "Cannot create site '" + siteName + "'.\n";
				if (msg.hasOwnProperty('error')) text += msg.error;
				window.alert(text);
				return;
			}

			nineoclock.loadSite(siteName);
			nineoclock.updateSites();
		});
	});

	jQuery('#post-new').on('click', function(event) {
		jQuery('#contents .site-section').hide();

		jQuery('#post-date').val(dateString())
		jQuery('#post-editor').show();
		jQuery('#post-title').focus();
	});

	// Post Edit button click
	jQuery('#posts-table').on('click', '.post-edit', function(event) {
		var obj = jQuery(this);
		var contents = decodeURI(obj.data('contents'));
		var postname = obj.data('postname');
		var meta = jsyaml.loadFront(contents);

		var categories = '';
		var tags = '';

		if (meta.categories)
			categories = meta['categories'].join(', ');

		if (meta.tags)
			tegs = meta['tags'].join(', ');

		// Loads and display interface
		jQuery('#contents .site-section').hide();

		jQuery('#post-title').val(meta['title']);
		jQuery('#post-contents').val(contents.replace(/^(-{3}(?:\n|\r)([\w\W]+?)-{3})?/,'').trim());
		jQuery('#post-filename').val(postname);
		jQuery('#post-oldfilename').val(postname);
		jQuery('#post-date').val(meta['date']);
		jQuery('#post-slug').val(meta['slug']);
		jQuery('#post-categories').val(categories);
		jQuery('#post-tags').val(tags);

		jQuery('#post-editor').show();
		jQuery('#post-contents').focus();

	});

	jQuery('#post-reload').on('click', function(event) {
		jQuery('#loading-mirror').show();
		nineoclock.loadPosts(nineoclock.currentSite.name, function() {
			jQuery('#loading-mirror').hide();
		});
	});

	jQuery('#post-save').on('click', function(event) {
		// TODO: Validate filename
		// TODO: Validate slug

		// Prepare the contents
		var contents = '---\n';
		contents += 'title: "' + jQuery('#post-title').val() + '"\n';
		contents += 'date: ' + jQuery('#post-date').val() + '\n';
		contents += 'slug: "' + jQuery('#post-slug').val() + '"\n';

		contents += 'categories:\n';
		var catStrings = jQuery('#post-categories').val().trim();
		if (catStrings.length > 0) { 
			contents += catStrings.split(',').map(function(a) { return("- " + a.trim()); }).join('\n');
			contents += '\n';
		}

		contents += 'tags:\n';
		var tagStrings = jQuery('#post-tags').val().trim();
		if (tagStrings.length > 0) { 
			contents += tagStrings.split(',').map(function(a) { return("- " + a.trim()); }).join('\n');
			contents += '\n';
		}

		contents += '---\n' + jQuery('#post-contents').val();

		// Prepare payload
		var postData = {
			'title': jQuery('#post-title').val(),
			'filename': jQuery('#post-filename').val(),
			'oldfilename': jQuery('#post-oldfilename').val(),
			'contents': contents
		};

		jQuery('#loading-mirror').show();

		// Send it
		jQuery.ajax({
			'url': '/site/posts/' + nineoclock.currentSite.name + '/save',
			'method': 'POST',
			contentType: 'application/json; charset=utf-8',
			'data': JSON.stringify({ 'post': postData })
		})
		.done(function(data) {
			jQuery('#loading-mirror').hide();
			if (data.hasOwnProperty('success') && data.success == false) {
				var text = "Cannot save post.";
				if (data.hasOwnProperty('error'))
					text += "\nReason: " + data.error;

				alert(text);
				return;
			}
			// TODO: Add post to the current post list.
			nineoclock.displayPosts();
		})
	});

	jQuery('#topactions').on('click', '.site-display-section', function(event) {
		var obj = jQuery(this);
		// Hide every section
		jQuery('#contents .site-section').hide()
		// Displays our requested section
		jQuery('#' + obj.data('sectionid')).show();
	});

	jQuery('#site-build').on('click', function(event) {
		jQuery.ajax('/site/build/' + nineoclock.currentSite.name)
		.done(function(data) {
			console.log(data);
		});
	});

	// Load sites
	nineoclock.updateSites();
};

jQuery(document).ready(function() {
	nineoclock_init(jQuery || $);
});
