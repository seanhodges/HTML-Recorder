var system = require('system');
var page = require('webpage').create();

var args = system.args;
var convertId = args[1];
var url = args[2];

var openAttrs = {
    operation: 'GET',
    encoding: 'utf8',
    headers: {
        'Content-Type': 'text/html'
    }
};

page.viewportSize = { width: 1000, height: 1000 };
page.offlineStorageQuota = 0;

page.settings.resourceTimeout = '8000';
page.settings.userAgent = 'WebKit/534.46 Mobile/9A405 Safari/7534.48.3';
page.settings.XSSAuditingEnabled = false;
page.settings.webSecurityEnabled = false;
page.settings.localToRemoteUrlAccessEnabled = true;

function onPageReady() {
    var info = page.evaluate(function() {
        // Move to end of animation
        var compId = Object.keys(AdobeEdge.compositions)[0];
        var stage = AdobeEdge.getComposition(compId).getStage();
        var duration = stage.data.stage.timeline.duration - 1;
        stage.stop(duration);

        var size = document.querySelector('#Stage').getBoundingClientRect();
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
    page.render('temp/poster-' + convertId + '.png', { format: 'png', quality: 0 });
    phantom.exit();
}

page.open(url, openAttrs, function(status) {
	if (status === 'success') {
        function checkReadyState() {
            setTimeout(function () {
                var readyState = page.evaluate(function () {
                    // Check to see if the stage has loaded
                    if (!window.hasOwnProperty('AdobeEdge') || !AdobeEdge.compositions || Object.keys(AdobeEdge.compositions).length < 1) return;
                    var compId = Object.keys(AdobeEdge.compositions)[0];
                    var comp = compId ? AdobeEdge.getComposition(compId) : null;
                    var stage = comp ? comp.getStage() : null;
                    return stage && stage.isPlaying() ? 'complete' : '';
                });

                if ('complete' === readyState) {
                    onPageReady();
                } else {
                    checkReadyState();
                }
            });
        }

        checkReadyState();
	}
	else {
		console.error('Failed: ', status);
	}
});
