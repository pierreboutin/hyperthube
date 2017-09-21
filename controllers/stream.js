var router = require('express').Router();
var path = require('path');
var fs = require('fs');
var torrent = require('../models/torrent.js');
var Converter = require('../models/converter.js');

//start download file, return status about file (dlpercent, encoding available, encoding percent)
router.get('/:hash/:file/ready', function (req, res) {
    //console.log(req.params.hash, req.params.file);
    //console.log(path.parse(req.params.file).ext.replace('.', ''), 'is video:', Converter.videoFormats.indexOf(path.parse(req.params.file).ext.replace('.', '')) >= 0);

    if (Converter.videoFormats.indexOf(path.parse(req.params.file).ext.replace('.', '')) < 0) {
        return res.status(404).end();
    }

    var hash = req.params.hash,
        file = req.params.file,
        pth = 'torrent/files/'+hash+'.torrent';

    var reso = parseInt(req.query.res) || 0,
        fps = parseInt(req.query.fps) || 0;

    var cancelRequest = false;
    req.on('close', (err) => {
        //console.log('----- cancel -----');
        cancelRequest = true;
        return res.status(404).end();
    });

    var time = Date.now();
    var key = torrent.startDownload(req, pth, file);
    torrent.getFile(req, key, reso, fps, (data) => {
        if (data && data.path) {
            var statFile = fs.statSync(data.path);

            //console.log('data.percent:', data.percent, 'secStreamable', data.secStreamable, 'estimatedTimeConv:', data.estimatedTimeConv, 'estimatedTimeDl', data.estimatedTimeDl);
            var wait = data.estimatedTimeConv > data.estimatedTimeDl ?  data.estimatedTimeConv : data.estimatedTimeDl;
            //console.log('WAIT', (wait - data.secStreamable)/2, (wait - data.secStreamable)/2/60, 'min', (wait - data.secStreamable)/2/60/2, 'min');
            var sec = Math.round(((wait - data.secStreamable)/2 + 30)/5);
            var min = parseInt(sec/60);
            sec -= min * 60;
            //console.log('start in', min, 'min', sec, 'sec |', (Date.now() - time)/1000);
            if (data.percent > 0 && min <= 0 && sec <= 0) {
                if (cancelRequest) return;
                res.jsonp({playable: true});
            }
            else {
                if (cancelRequest) return;
                res.jsonp({wait:{min,sec}, playable: false});
            }
        }
        else {
            //console.log('data is null');
            if (cancelRequest) return;
            return res.jsonp({playable: false});
        }
    });
});

router.get('/:hash/:file/webm', function (req, res) {
    //console.log(req.params.hash, req.params.file);
    //console.log(path.parse(req.params.file).ext.replace('.', ''), 'is video:', Converter.videoFormats.indexOf(path.parse(req.params.file).ext.replace('.', '')) >= 0);

    if (Converter.videoFormats.indexOf(path.parse(req.params.file).ext.replace('.', '')) < 0) {
        return res.status(404).end();
    }

    var hash = req.params.hash,
        file = req.params.file,
        pth = 'torrent/files/'+hash+'.torrent';

    var reso = parseInt(req.query.res) || 0,
        fps = parseInt(req.query.fps) || 0;

    var cancelRequest = false;
    req.on('close', (err) => {
        //console.log('----- cancel -----');
        cancelRequest = true;
        return res.status(404).end();
    });

    var parts = [0,0], start, end, chunksize, total;

    function calculSize(size, log, currentLen) {
        if (req.headers.range)
            parts = req.headers.range.replace(/bytes=/, "").split("-");
        total = size,
        start = parseInt(parts[0]),
        end = (parts[1] ? parseInt(parts[1]) : currentLen/*start+(1024*1024)*/-1);

        start = (start < total ? start : total-1);
        end = (end < total ? end : total-1);
        start = (start >= 0 ? start : 0);
        end = (end >= 0 ? end : 0);
        chunksize = (end-start)+1;
        //if (log)
        //   console.log('calculate range: ' + start + ' - ' + end + '/' + total + ' = ' + chunksize);
    }
    function send(pth, size) {
        //console.log('=================================');
        //console.log('Header range:', req.headers.range);
        //console.log('Sent: bytes ' + start + '-' + end+'/'+(size ? size : '*'), 'chunksize:', chunksize);
        if (cancelRequest) return;
        res.writeHead(206, {
            'Content-Range' : 'bytes ' + start + '-' + end+(size ? '/'+size : '/*'),//+(end+1000),// + '/' + total+10000,
            'Accept-Ranges' : 'bytes',
            'Content-Length': chunksize,
            'Content-Type' : 'video/webm'
        });
        var file = fs.createReadStream(pth, {start: start, end: end});
        file.pipe(res);
        //console.log('SEND !!!');
    }

    var time = Date.now();
    var key = torrent.startDownload(req, pth, file);
    var ppp = function() {
        torrent.getFile(req, key, reso, fps, (data) => {
            if (data && data.path) {
                var statFile = fs.statSync(data.path);

                //console.log('data.percent:', data.percent, 'secStreamable', data.secStreamable, 'estimatedTimeConv:', data.estimatedTimeConv, 'estimatedTimeDl', data.estimatedTimeDl);
                var wait = data.estimatedTimeConv > data.estimatedTimeDl ?  data.estimatedTimeConv : data.estimatedTimeDl;
                //console.log('WAIT', (wait - data.secStreamable)/2, (wait - data.secStreamable)/2/60, 'min', (wait - data.secStreamable)/2/60/2, 'min');
                var sec = Math.round(((wait - data.secStreamable)/2 + 30)/5);
                var min = parseInt(sec/60);
                sec -= min * 60;
                //console.log('start in', min, 'min', sec, 'sec |', (Date.now() - time)/1000);
                if (data.percent > 0 && (wait - data.secStreamable)/2 <= -30) {
                    calculSize(statFile.size, false, statFile.size);
                    if (!cancelRequest)
                        send(data.path, (data.percent == 100 ? statFile.size : false));
                }
                else {
                    if (!cancelRequest)
                        setTimeout(ppp, 1000);
                }
            }
            else {
                //console.log('data is null');
                if (cancelRequest) return;
                return res.status(404).end();
            }
        });
    }
    ppp();
});

router.get('/:hash/:file', function (req, res) {
    var hash = req.params.hash,
        file = req.params.file,
        pth = 'torrent/files/'+hash+'.torrent';

    var key = torrent.startDownload(req, pth, file);
    torrent.getAvailableSettings(key, (infos) => {
        //console.log('infos', infos);
        res.jsonp(infos);
    });
});

router.get('/:hash', function (req, res, next) {
    if (!req.session || !req.session.pseudo)
      return next();
    if (!req.params.hash) {
        //console.log('lolilol 404 1');
        //404
        return next();//res.status(404).end();
    }
    torrent.get(req, {hash: req.params.hash}, (obj) => {
        if (obj.success && obj.doc) {
            //console.log(obj.doc);
            //res.jsonp(obj.doc);
            res.sendFile(path.resolve('views/stream/html/stream.html'));
        }
        else {
            //console.log('lolilol 404');
            //404
            return next();//res.status(404).end();
        }
    });
});

module.exports = router;
