var system = require('system');
var page = require('webpage').create();

var args = system.args;
var url = args[1];

page.userAgent = 'WebKit/534.46 Mobile/9A405 Safari/7534.48.3';
page.viewportSize = { width: 1000, height: 1000 };
page.open(url, function(status) {
	if (status === "success") {
		window.setTimeout(function() {
			var info = page.evaluate(function() {
				// Move to end of animation
				var compId = Object.keys(AdobeEdge.compositions)[0];
				var stage = AdobeEdge.getComposition(compId).getStage();
				var duration = stage.data.stage.timeline.duration - 1;
				stage.stop(duration);

				var size = document.querySelector("#Stage").getBoundingClientRect();
				return {
					'duration' : duration,
					'top' : size.top,
					'left' : size.left,
					'width' : size.width,
					'height' : size.height
				};
			});
			//console.log('Snapping ' + info.width + 'x' + info.height + ' at = ' + info.duration);

			page.clipRect = { left: info.left, top: info.top, width: info.width, height: info.height };
			page.render('temp/poster.png');
			phantom.exit();
		}, 200);
	}
	else {
		console.log('Failed: ', status);
	}
});
