var express = require('express');
var cp = require('child_process');
var fs = require('fs');
var path = require('path');
var multer  = require('multer');
var yauzl = require('yauzl');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var uuid = require('uuid');

var upload = multer({ dest: 'temp/' });
var app = express();

app.get('/convert/:filename', function (req, res, next) {
    var convertId = generateConvertId(req);
    console.time(convertId);

    var format = path.extname(req.params.filename).substring(1);

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
    doGenerate(convertId, format, url, width, height, extra, function(code) {
        if (code == 0) {
            writeResult(convertId, format, res);
        }
        else {
            return next(new Error('Failed to run script, status code was ' + code));
        }
    });
});

app.post('/convert/:filename', upload.single('creative'), function (req, res, next) {
    var convertId = generateConvertId(req);
    res.convertId = convertId;
    console.time(convertId);

    var format = path.extname(req.params.filename).substring(1);

    // Unpack the zip
    if (!req.file || req.file.size <= 0) {
        res.status(500).send({ error: 'No input creative provided' });
        return;
    }
    unpack(convertId, req.file.path, function (unpackPath, htmlFile) {
        var url = 'file:///' + htmlFile;

        var width = req.query.width;
        var height = req.query.height;
        var extra = req.query.frame || '10';
        doGenerate(convertId, format, url, width, height, extra, function (code) {
            // Clean up POST data and send result
            console.log('Deleting: ' + unpackPath);
            rimraf(unpackPath, function (err) {
                if (err) throw err;

                if (code == 0) {
                    console.log('Unlinking: ' + req.file.path);
                    fs.unlink(req.file.path, function (err) {
                        if (err) throw err;

                        writeResult(convertId, format, res);
                    });
                }
                else {
                    return next(new Error('Failed to run script, status code was ' + code));
                }
            });
        });
    });
});

// Default error handler
app.use(function(err, req, res, next) {
    var failPath = 'failed/' + path.basename(req.file.path) + ".zip";
    mkdirp(path.dirname(failPath));

    // Move the failed file and write the error to the output
    console.log('Moving failed input to ' + failPath);
    fs.rename(req.file.path, failPath, function () {
        if (res.headersSent) {
            return next(err);
        }

        writeError(res.convertId, res, err);
    });
});


function generateConvertId(req) {
    var ip = req.ip;
    // Strip out any ipv6 preamble
    if (ip.indexOf('::') > -1) ip = ip.substring(ip.lastIndexOf(':') + 1);
    ip = ip.replace(/[!\W]/g, '.');
    return 'convert-task-' + ip + '-' + uuid.v4();
}

function unpack(convertId, file, successCallback) {
    console.time(convertId + '-unpack');
    var rootPath = 'temp/zipcontents-' + convertId + '/';
    var htmlFile = rootPath;
    mkdirp(path.dirname(rootPath));

    yauzl.open(file, {lazyEntries: true}, function(err, zipfile) {
        if (err) throw err;
        zipfile.on('entry', function(entry) {
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
                        readStream.on('end', function() {
                            console.log('Unpacking file: ' + entry.fileName);
                            if (entry.fileName.indexOf('.html') > -1 && entry.fileName.indexOf('/') == -1) {
                                // Found the HTML file
                                htmlFile = path.resolve(rootPath + entry.fileName);
                                console.log('Found HTML page: ' + htmlFile);
                            }
                            zipfile.readEntry();
                        });
                    });
                });
            }
        });
        zipfile.on('error', function(err) {
            throw err;
        });
        zipfile.once('end', function() {
            zipfile.close();
            console.timeEnd(convertId + '-unpack');
            successCallback.call(this, rootPath, htmlFile);
        });
        zipfile.readEntry();
    });
}

function doGenerate(convertId, format, url, width, height, extra, callback) {
    console.time(convertId + '-generate');
    url = url.replace(/ /g, '%20');
    console.log(format + ' ' + url);

    // Run the appropriate script
	var scriptName = 'html5video.sh';
	if (url.indexOf('swf') > -1) scriptName = 'swfvideo.sh';
    if (url.indexOf('html') > -1 && format == 'png') scriptName = 'takeposter.sh';

    console.log(path.resolve(__dirname, scriptName));
	var spawn = cp.spawn;
    var script = spawn(path.resolve(__dirname, scriptName), [convertId, url, width, height, format, extra]);

    script.stdout.on('data', function (data) {
        console.log('stdout: ' + data);
    });

    script.stderr.on('data', function (data) {
        console.log('stderr: ' + data);
    });

    script.on('exit', function (code) {
        console.log('child process exited with code ' + code);
        console.timeEnd(convertId + '-generate');
        callback.call(this, code);
    });
}

function writeResult(convertId, format, res) {
    console.time(convertId + '-write-output');
    var outputFile = path.resolve(__dirname,'out.mp4');
    var mimeType = 'video/mp4';
    if (format === 'png') {
        outputFile = path.resolve(__dirname, 'temp', 'poster-' + convertId + '.png');
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

    // Clean up
    fs.unlink(outputFile);

    console.timeEnd(convertId + '-write-output');
    console.timeEnd(convertId);
}

function writeError(convertId, res, err) {
    console.error(err);
    console.time(convertId + '-write-error');

    res.setHeader('Content-Type', 'text/plain');
    res.writeHead(500);
    res.write(err.toString());
    res.end();

    console.timeEnd(convertId + '-write-error');
    console.timeEnd(convertId);
}

var server = app.listen(17142, function () {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Output convertor listening at http://%s:%s', host, port);
});
