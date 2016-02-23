(function($, window, document, undefined) {
	$(document).ready(function() {
		$('.level-bar-inner').css('width', '0');

		$(window).on('load', function() {
			$('.level-bar-inner').each(function() {
				var itemWidth = $(this).data('level');

				$(this).animate({
					width: itemWidth
				}, 800);
			});
		});
		
		$('.level-label').tooltip();

		GitHubCalendar('#github-graph', 'rebendajirijr');
		
		GitHubActivity.feed({
			username: 'rebendajirijr',
			selector: '#ghfeed'
		});
		
		Packagist.feed({
			vendor: 'jr',
			selector: '#packagist-feed',
		});
	});
})(jQuery, window, document);