var router = require('express').Router();
var ffmpeg = require('fluent-ffmpeg');
var path = require('path');
var fs = require('fs');
var Bittorrent = require('../bittorrentProtocol/Bittorrent/bittorrent.js');
var request = require('request');

router.get('/files/:hash', function (req, res) {
    request.get(req.app.locals.apiURL+'/api/torrent/files', {qs: {token: req.app.locals.apiToken, hash: req.params.hash}}, function(err, result, data) {
        data = JSON.parse(data);
        //console.log(data);
        res.jsonp(data);
    });
});

///status/:hash ?

router.get('/download/:url', function (req, res) {
    request.get(req.app.locals.apiURL+'/api/torrent/download', {qs: {token: req.app.locals.apiToken, url: req.params.url}}, function(err, result, data) {
        data = JSON.parse(data);
        if (data.success && data.hash) {
            res.jsonp({success:true, redirect:'/stream/'+data.hash});
        }
        else {
            res.jsonp({success:false, message:'Error in downloading torrent file.'});
        }
    });
});

module.exports = router;
