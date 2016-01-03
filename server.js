var express = require('express');
var cp = require('child_process');
var fs = require('fs');
var path = require('path');

var app = express();

app.get('/video', function (req, res) {
	if (req.headers.range) {
		var outputFile = path.resolve(__dirname,"out.mp4")
		var stats = fs.statSync(outputFile)
		var size = stats["size"]
		var range = req.headers.range;

		var parts = range.replace(/bytes=/, "").split("-");
		var partialstart = parts[0];
		var partialend = parts[1];

		var start = parseInt(partialstart, 10);
		var end = partialend ? parseInt(partialend, 10) : size-1;
		var chunksize = (end-start)+1;

		var file = fs.createReadStream(outputFile, {start: start, end: end});
		res.writeHead(206, { 
			"Content-Range": "bytes " + start + "-" + end + "/" + size, 
			"Accept-Ranges": "bytes", 
			"Content-Length": chunksize, 
			"Content-Type": 'video/mp4' 
		});
		file.pipe(res);
		return;
	}
	doGet('video', req, res);
});

app.get('/static', function (req, res) {
	doGet('static', req, res);
});

function doGet(format, req, res) {
	var url = req.query.src;
	var width = req.query.width;
	var height = req.query.height;
	
	var cmd = path.resolve(__dirname, 'html5video.sh') + ' ' + url + ' ' + width + ' ' + height;

	if (format == 'static') {
		cmd = path.resolve(__dirname, 'takeposter.sh') + ' ' + url;
	}

	console.log(cmd);
	cp.exec(cmd, function(error, stdout, stderr) {
		if (error) {
			res.send('Errored: ' + error);
		}
		else {
			console.log(stdout, stderr);

			var outputFile = path.resolve(__dirname,"out.mp4")
			var mimeType = 'video/mp4';

			if (format === 'static') {
				outputFile = path.resolve(__dirname, 'temp', "poster.png");
				mimeType = 'image/png';
			}

			var stats = fs.statSync(outputFile)
			var size = stats["size"]
			console.log(mimeType, size);

			res.writeHead(200, { 
				"Content-Length": size, 
				"Content-Type": mimeType
			});
			fs.createReadStream(outputFile).pipe(res);
		}
	});
};

var server = app.listen(17142, function () {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Example app listening at http://%s:%s', host, port);
});
