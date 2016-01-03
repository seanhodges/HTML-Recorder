console.log('Phantom started');

var system = require('system');
var page = require('webpage').create();

var args = system.args;
var url = args[1];
var width = args[2];
var height = args[3];
var format = args.length > 4 ? args[4] : 'mp4';
var targetFrame = args.length > 5 ? parseInt(args[5]) + 2 : 11;
var framerate = 200;
var framecount = 100;

function toFixedLength(number) {
    return (number < 10 ? '0' : '') + number
}

page.userAgent = 'WebKit/534.46 Mobile/9A405 Safari/7534.48.3';
page.viewportSize = { width: width, height: height };
page.onError = function(msg, trace) {
    console.log('error=' + msg);
    // Do nothing...
};
page.onResourceTimeout = function(e) {
    console.log(e.errorCode);   // it'll probably be 408
    console.log(e.errorString); // it'll probably be 'Network timeout on resource'
    console.log(e.url);         // the url whose request timed out
    phantom.exit(1);
};

console.log('Connecting...');
page.settings.resourceTimeout = 5000; // Give up after 5 seconds
var connected = false;
page.open(url, function(status) {
    console.log('status=' + status);
    if (status === "success" && !connected) {
        connected = true;
        console.log('Connected!');
        page.clipRect = { left: 0, top: 0, width: width, height: height };
        var frame = 0;
        var timer = window.setInterval(function() {
            frame++;
            page.render('temp/output' + toFixedLength(frame) + '.png');
            if (frame >= framecount || (frame > targetFrame && format === 'png')) {
                    phantom.exit();
                    window.clearInterval(timer);
            }
        }, framerate);
    }
    else {
            console.log('Failed: ', status);
    }
});

