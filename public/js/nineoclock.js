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
		});
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

	// Load sites
	nineoclock.updateSites();
};

jQuery(document).ready(function() {
	nineoclock_init(jQuery || $);
});