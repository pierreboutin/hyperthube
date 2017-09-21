var apiRouter = require('express').Router();
var jwt = require('jsonwebtoken');
var path = require('path');
var fs = require('fs');
var account = require('../models/api/account.js');
var archive = require('../models/api/archive.org.js');
var imdb = require('../models/api/imdb.js');
var torrent = require('../models/torrent.js');
var Converter = require('../models/converter.js');

var secret = 'lolilol il faut changer cette clee privée pour quelle soit super secure :;,!;:+-/-*+éç_(è"é\'-àè\'")';

/** status :
 *  201	Created	Requête traitée avec succès et création d’un document.
 *  401	Unauthorized    pas authentifié
 *  403	Forbidden       pas droit d'acces assez élevé
 *  404 not found       pas trouvé
 */

var verifyToken = function(req, res, next) {
    var token = req.body.token || req.query.token;
    //console.log(req.query);
    if (token) {
        jwt.verify(token, secret, function(err, decoded) {
            if (err) {
                return res.status(401).jsonp({
                    success: false,
                    message: 'Failed to authenticate token.',
                    error: err.name
                });
            }
            else {
                req.decoded = decoded;
                //console.log(decoded);
                next();
            }
        });
    }
    else {
        return res.status(401).jsonp({
            success: false,
            message: 'No token provided.'
        });
    }
};

var verifyAdmin = function(req, res, next) {
    if (req.decoded && req.decoded.admin) {
        next();
    }
    else {
        return res.status(403).jsonp({
            success: false,
            message: 'Admin right required.'
        });
    }
};

/** right access :
 *  public  no token required
 *  user    token required
 *  admin   token required with admin access
 */


/** ****************************** **
    GET /api/archive.org user
        get archive.org data
 ** ****************************** **/
apiRouter.get('/archive.org', verifyToken, function(req, res) {
    archive.get(req.query.search, req.query.page, (err)=>{
        //console.log('finish !!!');
        res.jsonp(err);
    });
});

/** ****************************** **
    GET /api/imdb user
        get imdb data
 ** ****************************** **/
apiRouter.get('/imdb', verifyToken, function(req, res) {
    imdb.get(req.query.title, (err)=>{
        //console.log('finish !!!');
        res.jsonp(err);
    });
});


/** ****************************** **
    POST /api/authenticate public
        get token with username and password
 ** ****************************** **/
apiRouter.post('/authenticate', function(req, res) {
    var username = req.body.username,
        email = req.body.email,
        password = req.body.password;

    account.check(req, {username, password, email}, (ret)=>{
        if (ret.success) {
            var token = jwt.sign({
                username,
                email,
                admin:ret.admin,
            }, secret, {
                expiresIn: 24*60*60 // expires in 24 hours
            });
            res.jsonp({
                success: true,
                message: 'Enjoy your token !',
                token
            });
        }
        else
            res.status(401).jsonp(ret);

    });
});

apiRouter.all('/authenticate', function(req, res) {
    res.status(401).jsonp({
        success: false,
        message: 'Use POST method for authenticate.'
    });
});

/** ****************************** **
    POST /api/account public
        create a dev account for api
    DELETE /api/account user
        delete your account
    DELETE /api/account admin
        delete any account
 ** ****************************** **/
apiRouter.post('/account', function(req, res) {
    //console.log(req.body);
    var username = req.body.username,
        password = req.body.password,
        email = req.body.email;

    account.new(req, {username, password, email}, (err)=>{
        //console.log('finish', err);
        //console.log('--------------------');
        res.jsonp(err);
    });
});

apiRouter.delete('/account', verifyToken, function(req, res) {
    //console.log(req.body);
    var username = req.body.username,
        password = req.body.password,
        email = req.body.email;

    account.delete(req, {username, password, email, token: req.decoded}, (err)=>{
        //console.log('finish', err);
        //console.log('--------------------');
        res.jsonp(err);
    });
});

apiRouter.all('/account', function(req, res) {
    res.status(401).jsonp({
        success: false,
        message: 'Use POST or DELETE method for account.'
    });
});


/** ****************************** **
    GET /api/doc public
        api doc json
 ** ****************************** **/
apiRouter.all('/doc', function(req, res) {
    var doc = JSON.parse(fs.readFileSync(path.resolve('models/api/docapi.json')));
    res.jsonp(doc);
});


/** ****************************** **
    GET /api/subtitles public
        download movie subs
        params : title
 ** ****************************** **/
apiRouter.get('/subtitles', function(req, res) {
    var yifysubtitles = require('yifysubtitles');
    //console.log ("SUBS REQ QUERY : " + JSON.stringify(req.query));

    if (req.query.title) {
        imdb.get(req.query.title, (imdb_res) => {
            if (imdb_res && imdb_res.success) {
                //console.log ("IMDB MOVIE INFO : " + JSON.stringify(imdb_res));
                yifysubtitles(imdb_res.id, {
                    path: './public/subtitles',
                    langs: ['fr', 'en', 'uk', 'es']
                }).then(subs => {
                    res.jsonp({success: true, subtitles:subs});
                }).catch(err => {
                    res.jsonp({success:false, message:'Yifisubtitles err: ' + err});
                });
            }
            else {
                //console.log ("IMDB NOT FOUND : " + JSON.stringify(imdb_res));
                res.jsonp({success:false, message:'No subs found'});
            }
        });
    }
});

/** ****************************** **
    GET /api/torrent/download public
        download a torrent file
        params : url
 ** ****************************** **/
apiRouter.get('/torrent/download', verifyToken, function(req, res) {
    if (req.query.url) {
        torrent.download(req.query.url, (path)=>{
            //console.log(path);
            torrent.get(req, {path}, (obj)=>{
                if (obj.success && !obj.doc) {
                    torrent.add(req, path, (obj)=>{
                        if (!obj.success) {
                            fs.unlinkSync(path);
                            return res.jsonp(obj);
                        }
                        res.jsonp({success:true, hash:obj.hash});
                    });
                }
                else if (obj.success && obj.doc) {
                    //console.log(obj.doc, path);
                    fs.unlinkSync(path);
                    res.jsonp({success:true, hash:obj.doc.hash});
                }
                else {
                    return res.jsonp(obj);
                }
            });
        });
    }
    else {
        res.jsonp({success:false, message:'Need url parameter.'});
    }
});

/** ****************************** **
    GET /api/torrent/files public
        get list of files who can be stream in a torrent
        params : hash
 ** ****************************** **/
apiRouter.get('/torrent/files', verifyToken, function(req, res) {
    if (req.query.hash) {
        torrent.getInfos(req, {hash:req.query.hash}, (obj)=>{
            if (obj.files) {
                var arr = [];
                for (var i = 0; i < obj.files.length; i++) {
                    if (Converter.videoFormats.indexOf(path.parse(obj.files[i].path).ext.replace('.', '')) >= 0) {
                        var file = obj.files[i].path;
                        //var hash = req.query.hash,
                        //    pth = 'torrent/files/'+hash+'.torrent',
                        //    key = pth+'#'+file;
                        //var percentDl = 0, percentEncod = 0;
                        //if (torrent.isDownloading(key)) {
                        //    percentDl = torrent.dwnlds[key].percent || (1-1);
                        //    percentEncod = torrent.dwnlds[key].percentEncod || (1-1);
                        //}
                        arr.push({name:file});
                    }
                }
                //filter bad extension :
                obj.files = arr;
            }
            res.jsonp(obj);
        });
    }
    else {
        res.jsonp({success:false, message:'Need hash parameter.'});
    }
});

/** ****************************** **
    GET /api/stream public
        get stream
        params : hash, files
    /stream/ hash file
    /
 ** ****************************** **/
/*
apiRouter.get('/stream', verifyToken, function(req, res) {
    var doc = JSON.parse(fs.readFileSync(path.resolve('models/api/docapi.json')));
    res.jsonp(doc);
});
doc:
{
    "method":"GET",
    "url":"/api/stream",
    "access":"user",
    "info":"stream a file",
    "parameter":{
        "token":"your admin token",
        "hash":"hash of torrent",
        "file":"file to stream in the torrent"
    },
    "return":{
        "&lt;binary stream&gt;":"return a webm file"
    }
},
*/

/** ****************************** **
    GET /api public
        api doc and account
 ** ****************************** **/
apiRouter.all('/', function(req, res) {
    res.sendFile(path.resolve('views/api/html/index.html'));
});

apiRouter.all('*', function(req, res) {
   res.status(404).jsonp({
       success: false,
       message: 'Not found.'
   });
});

module.exports = apiRouter;
