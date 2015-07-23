var system = require('system');
var page = require('webpage').create();

var args = system.args;
var url = args[1]; //http://localhost:8080/File/job/localhost/1437491849452/html5/
var width = args[2]; //300; // 728
var height = args[3]; //250; // 90
var single = args.length > 4 ? args[4] : 'false'; //false
var targetFrame = args.length > 5 ? parseInt(args[5]) + 2 : 11; //false
var framerate = 200;
var framecount = 100;

function toFixedLength(number) {
    return (number < 10 ? '0' : '') + number
}

page.userAgent = 'WebKit/534.46 Mobile/9A405 Safari/7534.48.3';
page.viewportSize = { width: width, height: height };
page.open(url, function(status) {
	if (status === "success") {
		page.clipRect = { left: 0, top: 0, width: width, height: height };
		var frame = 0;
		var timer = window.setInterval(function() {
			frame++;
			page.render('temp/output' + toFixedLength(frame) + '.png');
			if (frame >= framecount || (frame > targetFrame && single === 'true')) {
				phantom.exit();
				window.clearInterval(timer);
			}
		}, framerate);
	}
	else {
		console.log('Failed: ', status);
	}
});
