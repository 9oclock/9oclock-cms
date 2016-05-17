function nineoclock_init(jQuery) {
	var nineoclock = {};
	window.nineoclock = nineoclock;

	nineoclock.currentSite = {};

	nineoclock.updateSites = function() {
		jQuery.ajax('/sites').done(updateSiteList);
	};

	nineoclock.loadSite = function(siteName) {
		jQuery('#currentsite').html(siteName);
		nineoclock.currentSite.name = siteName;
		jQuery.ajax('/site/info/' + siteName).done(function(data) {
			console.log(data);
			nineoclock.currentSite.settings = data;

			jQuery('#topactions').show();
			jQuery('#sitetitle').html(siteName);
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

	jQuery('#topactions').on('click', '.site-display-section', function(event) {
		var obj = jQuery(this);
		// Hide every section
		jQuery('#contents .site-section').hide()
		// Displays our requested section
		jQuery('#' + obj.data('sectionid')).show();
	});

	// Load sites
	nineoclock.updateSites();
};

jQuery(document).ready(function() {
	nineoclock_init(jQuery || $);
});
