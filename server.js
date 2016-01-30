var express = require('express');
var cp = require('child_process');
var fs = require('fs');
var path = require('path');
var multer  = require('multer');
var yauzl = require("yauzl");
var mkdirp = require("mkdirp");

var upload = multer({ dest: 'temp/' });
var app = express();

app.get('/convert/:filename', function (req, res) {
    var format = path.extname(req.params.filename);

    if (req.headers.range) {
        // Streaming a video back that has already been generated
        var outputFile = path.resolve(__dirname,'out.mp4')
        var stats = fs.statSync(outputFile)
        var size = stats['size']
        var range = req.headers.range;

        var parts = range.replace(/bytes=/, '').split('-');
        var partialstart = parts[0];
        var partialend = parts[1];

        var start = parseInt(partialstart, 10);
        var end = partialend ? parseInt(partialend, 10) : size-1;
        var chunksize = (end-start)+1;

        var file = fs.createReadStream(outputFile, {start: start, end: end});
        res.writeHead(206, {
            'Content-Range': 'bytes ' + start + '-' + end + '/' + size,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4'
        });
        file.pipe(res);
        return;
    }

    var url = req.query.src;
    var width = req.query.width;
    var height = req.query.height;
    var extra = req.query.frame || '10';
    doGenerate(format, url, width, height, extra, res);
});

app.post('/convert/:filename', upload.single('creative'), function (req, res) {
    var format = path.extname(req.params.filename);

    // Unpack the zip
    if (!req.file || req.file.size <= 0) {
        res.status(500).send({ error: 'No input creative provided' });
    }
    unpack(req.file.path, function(unpacked) {
        var url = 'file://' + unpacked;
        var width = req.query.width;
        var height = req.query.height;
        var extra = req.query.frame || '10';
        doGenerate(format, url, width, height, extra);
    });
});

/*
app.get('/video', function (req, res) {
	if (req.headers.range) {
		var outputFile = path.resolve(__dirname,'out.mp4')
		var stats = fs.statSync(outputFile)
		var size = stats['size']
		var range = req.headers.range;

		var parts = range.replace(/bytes=/, '').split('-');
		var partialstart = parts[0];
		var partialend = parts[1];

		var start = parseInt(partialstart, 10);
		var end = partialend ? parseInt(partialend, 10) : size-1;
		var chunksize = (end-start)+1;

		var file = fs.createReadStream(outputFile, {start: start, end: end});
		res.writeHead(206, { 
			'Content-Range': 'bytes ' + start + '-' + end + '/' + size, 
			'Accept-Ranges': 'bytes', 
			'Content-Length': chunksize, 
			'Content-Type': 'video/mp4' 
		});
		file.pipe(res);
		return;
	}
	doGet('mp4', req, res);
});

app.get('/static', function (req, res) {
	doGet('png', req, res);
});

app.get('/animation', function (req, res) {
	doGet('gif', req, res);
});
*/

function unpack(path, successCallback) {
    var rootPath = 'test/zipcontents/';
    mkdirp(path.dirname(rootPath));

    yauzl.open(path, {lazyEntries: true}, function(err, zipfile) {
        if (err) throw err;
        zipfile.on("entry", function(entry) {
            if (/\/$/.test(entry.fileName)) {
                // directory file names end with '/'
                mkdirp(rootPath + entry.fileName, function(err) {
                    if (err) throw err;
                    zipfile.readEntry();
                });
            } else {
                // file entry
                zipfile.openReadStream(entry, function(err, readStream) {
                    if (err) throw err;
                    // ensure parent directory exists
                    mkdirp(path.dirname(rootPath + entry.fileName), function(err) {
                        if (err) throw err;
                        readStream.pipe(fs.createWriteStream(rootPath + entry.fileName));
                        readStream.on("end", function() {
                            zipfile.readEntry();
                        });
                    });
                });
            }
        });
        zipfile.on("error", function(err) {
            throw err;
        });
        zipfile.once('end', function() {
            zipfile.close();
            successCallback.call(this, rootPath);
        });
        zipfile.readEntry();
    });
}

function doGenerate(format, url, width, height, extra, res) {
    // Run the appropriate script
	var scriptName = 'html5video.sh';
	if (url.indexOf('swf') > -1) scriptName = 'swfvideo.sh';
    if (url.indexOf('html') > -1 && format == 'png') scriptName = 'takeposter.sh';

	/*var cmd = path.resolve(__dirname, scriptName) + ' ' + url + ' ' + width + ' ' + height + ' ' + format + ' ' + extra;
	if (format == 'png') {
		cmd = path.resolve(__dirname, 'takeposter.sh') + ' ' + url;
	}
	console.log(cmd);*/

	var spawn = cp.spawn;
    var script = spawn(path.resolve(__dirname, scriptName), [url, width, height, format, extra]);

    script.stdout.on('data', function (data) {
        console.log('stdout: ' + data);
    });

    script.stderr.on('data', function (data) {
        console.log('stderr: ' + data);
    });

    script.on('exit', function (code) {
        console.log('child process exited with code ' + code);
        if (code != 0) return;

        var outputFile = path.resolve(__dirname,'out.mp4')
        var mimeType = 'video/mp4';
        if (format === 'png') {
                outputFile = path.resolve(__dirname, 'temp', 'poster.png');
                mimeType = 'image/png';
        }
        else if (format === 'gif') {
                outputFile = path.resolve(__dirname, 'out.gif');
                mimeType = 'image/gif';
        }

        var stats = fs.statSync(outputFile);
        var size = stats['size'];
        console.log(mimeType, size);

        res.writeHead(200, {
                'Content-Length': size,
                'Content-Type': mimeType
        });
        fs.createReadStream(outputFile).pipe(res);
    });
};

var server = app.listen(17142, function () {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Output convertor listening at http://%s:%s', host, port);
});
