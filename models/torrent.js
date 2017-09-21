var parseTorrentFile = require('parse-torrent-file'),
    request = require('request'),
    crypto = require('crypto'),
    path = require('path'),
    fs = require('fs');
var Bittorrent = require('../bittorrentProtocol/Bittorrent/bittorrent.js');
var utilsLib = require('./utils');

var ffmpeg = require('fluent-ffmpeg');
var Converter = require('../models/converter.js');

var torrent = {};

function sha1(str) {
    return crypto.createHash('sha1').update(str, 'utf8').digest('hex');
}

function sha1File(path, callback) {
    var stream = fs.createReadStream(path),
        hash = crypto.createHash('sha1');
    stream.on('data', function(data) {
        hash.update(data, 'utf8');
    })
    .on('end', function() {
        callback(hash.digest('hex'));
    })
    .on('error', function() {
        callback(hash.digest('hex'));
    });
}

torrent.dwnlds = {};

torrent.isDownloading = function(key) {
    //console.log(key, Object.keys(torrent.dwnlds), !!torrent.dwnlds[key]);
    return !!torrent.dwnlds[key];
}

torrent.getAvailableSettings = function(key, cb) {
    if (this.dwnlds[key].converter) {
        this.dwnlds[key].converter.availableSettings((infos) => {
            //console.log('KEY 0:', key, infos, this.dwnlds[key].converter.nameFile);
            if (infos.success) {
                for (var i = 0; i < infos.choices.length; i++) {
                    var data = this.dwnlds[key].converter.getData(infos.choices[i]);
                    if (data !== null) {
                        infos.choices[i].percent = data.percent;
                        infos.choices[i].secStreamable = data.secStreamable;
                    }
                }
            }
            infos.percent = this.dwnlds[key].converter.percent;
            infos.duration = this.dwnlds[key].converter.duration;
            cb(infos);
        });
    }
    else {
        setTimeout(() => {
            torrent.getAvailableSettings(key, cb);
        }, 500);
    }
}

torrent.getFile = function(req, key, res, fps, cb) {
    if (this.dwnlds[key].converter) {
        this.dwnlds[key].converter.checkSettings({res, fps}, (settings)=>{
            if (settings) {
                this.dwnlds[key].converter.addEncoder(settings, (data, newFile) => {
                    var fileViewInter = setInterval(()=>{
                        if (this.dwnlds[key].hash) {
                            if (newFile) {
                                torrent.fileView(req, this.dwnlds[key].hash, key, [data.path]);
                            }
                            else {
                                torrent.fileView(req, this.dwnlds[key].hash, key);
                            }
                            clearInterval(fileViewInter);
                        }
                    }, 1000);
                    data.estimatedTimeDl = this.dwnlds[key].converter.estimatedTimeDl;
                    //data.duration = this.dwnlds[key].converter.duration;
                    cb(data);
                });
            }
            else {
                console.log('this settings doesn\'t exist !');
                console.log(settings);
                cb(null);
            }
        });
    }
    else {
        cb({success:false});
    }
}


torrent.startDownload = function(req, pth, file, cb) {
    var torrentPath = path.resolve(pth),
        key = pth+'#'+file;

    if (!this.isDownloading(key)) {
        this.dwnlds[key] = {};
        this.dwnlds[key].hash = null;
        sha1File(torrentPath, (sha1)=>{
            this.dwnlds[key].hash = sha1;
        });
        this.dwnlds[key].downloader = new Bittorrent(torrentPath, [file]);

        console.log('add new Bittorrent');
        console.log('file:', file);
        this.dwnlds[key].downloader.init();
        this.dwnlds[key].downloader.started((fileInfos) => {
            console.log('[[[ Start download ]]] - key:', key);
            var fileViewInter = setInterval(()=>{
                if (this.dwnlds[key].hash) {
                    torrent.fileView(req, this.dwnlds[key].hash, key, [fileInfos.path+'/'+fileInfos.name]);
                    clearInterval(fileViewInter);
                }
            }, 1000);

            //this.dwnlds[key].downloader.filesInfo(null, {verbose: false}, (fileInfos) => {
                //this.dwnlds[key].originalFile = filePath;
                this.dwnlds[key].converter = new Converter(fileInfos.path, fileInfos.name, fileInfos.finalLen);

                //console.log('KEY:', key);

                //var time = Date.now(), percent = 0, speedDl = [], stuck = 0;
                this.dwnlds[key].inter = setInterval(()=>{
                    if (this.dwnlds[key].inter !== null) {
                        //console.log('KEY 2:', key);
                        //console.log('update', this.dwnlds[key].downloader);
                        this.dwnlds[key].downloader.currentLen([file], (currentLen) => {
                            this.dwnlds[key].converter.update(currentLen);
                            /*
                            console.log('percent', this.dwnlds[key].converter.percent, this.dwnlds[key].converter.nameFile);
                            //console.log(this.dwnlds[key].converter.currentLen.converters[index].encodedData);
                            if (percent == 0) {
                                time = Date.now();
                                percent = this.dwnlds[key].converter.currentLen;
                                console.log('set to', percent);
                            }
                            else if (this.dwnlds[key].converter.currentLen - percent > 0) {
                                var now = Date.now();
                                speedDl.push(((this.dwnlds[key].converter.currentLen - percent)/1024) / ((now - time)/1000));
                                if (speedDl.length > 5) {
                                    speedDl.shift();
                                }
                                var speed = 0;
                                speedDl.forEach((val)=>{
                                    speed += val;
                                });
                                speed /= speedDl.length;
                                console.log('speed:', speed);
                                console.log('estimatedTimeDl', ((this.dwnlds[key].converter.finalLen-this.dwnlds[key].converter.currentLen)/1024) / speed);
                                percent = this.dwnlds[key].converter.currentLen;
                                time = now;
                                stuck = 0;
                            }
                            else {
                                stuck++;
                                console.log(stuck);
                            }
                            */
                        });
                    }
                }, 2500);
            //});
        });
        this.dwnlds[key].downloader.finished((fileInfos) => {
            console.log('[[[ Finish download ]]] - key:', key, fileInfos);
            if (this.dwnlds[key].inter) {
                clearInterval(this.dwnlds[key].inter);
                this.dwnlds[key].inter = null;
                console.log('inter is null');
            }
            //this.dwnlds[key].originalFile = filePath;
            if (!this.dwnlds[key].converter) {
                //this.dwnlds[key].downloader.filesInfo(null, {verbose: false}, (fileInfos) => {
                //});
                this.dwnlds[key].converter = new Converter(fileInfos.path, fileInfos.name, fileInfos.finalLen);
                delete this.dwnlds[key].downloader;
                this.dwnlds[key].converter.finished();
            }
            else {
                delete this.dwnlds[key].downloader;
                this.dwnlds[key].converter.finished();
            }
        });
    }
    else {
        //console.log('Key exist', key);
    }
    return key;
}

torrent.download = function(url, callback) {
    var name = './torrent/files/tmp-'+sha1(url+new Date())+'.torrent';
    var write = fs.createWriteStream(name);
    var options = { headers: {'user-agent': 'node.js'} };
    request.get(url, options, function(err, res) {
        write.close();
        callback(name);
    }).pipe(write);
}

torrent.getInfos = function(req, obj, callback) {
    var db = req.app.locals.db;
    var torrentdb = db.collection('torrent');

    torrent.get(req, obj, (object)=>{
        if (object.success && object.doc) {
            var trnt = fs.readFileSync(object.doc.file), parsed;
            try {
                parsed = parseTorrentFile(trnt);
            } catch (err) {
                return callback({success: false, message: 'Error: torrent file was corrupt.', error: err});
            }
            callback({success: true, files: parsed.files});
        }
        else if (object.success && !object.doc) {
            callback({success: false, message: 'Torrent not found.'});
        }
        else {
            callback(object);
        }
    });
}

torrent.get = function(req, obj, callback) {
    var db = req.app.locals.db;
    var torrentdb = db.collection('torrent');

    if (obj.path) {
        sha1File(obj.path, (sha1)=>{
            torrentdb.findOne({hash: sha1}, {}, function(err, doc) {
                if (!err && !doc) {
                    callback({success: true, doc:null, message: 'File not exist.'});
                }
                else if (!err && doc)
                    callback({success: true, doc});
                else
                    callback({success: false, message: 'Error in mongodb request.', error: err});
            });
        });
    }
    else if (obj.hash) {
        torrentdb.findOne({hash: obj.hash}, {}, function(err, doc) {
            if (!err && !doc) {
                callback({success: true, doc:null, message: 'File not exist.'});
            }
            else if (!err && doc)
                callback({success: true, doc});
            else
                callback({success: false, message: 'Error in mongodb request.', error: err});
        });
    }
    else {
        callback({success: false, message: 'Bad input, need path or hash to get torrent.'});
    }
}

torrent.add = function(req, path, callback) {
    var db = req.app.locals.db;
    var torrentdb = db.collection('torrent');

    sha1File(path, (sha1)=>{
        var obj = {
            hash: sha1,
            file: './torrent/files/'+sha1+'.torrent',
            files: []
        }
        var trnt = fs.readFileSync(path), parsed;
        try {
            parsed = parseTorrentFile(trnt);
        } catch (err) {
            return callback({success: false, message: 'Error: torrent file was corrupt.', error: err});
        }
        //console.log(parsed.name)
        torrentdb.insertOne(obj, function(err, r) {
            if (!err) {
                //console.log(err, r);
                fs.renameSync(path, obj.file);
                callback({success: true, hash:obj.hash, message: 'Torrent add.'});
            }
            else
                callback({success: false, message: 'Error in insert.', error: err});
        });
    })
}

torrent.fileView = function(req, hash, key, files) {
    var db = req.app.locals.db;
    var torrentdb = db.collection('torrent');

    //console.log('============================================= update');
    files = Array.isArray(files) ? files : [];
    torrentdb.update({hash, "files.key": key}, {$set: {"files.$.date" : new Date()}, $push: {"files.$.files": {$each: files}}}, function (err, res) {
        //console.log('update', err);
        //console.log(res.result.nModified);
        if (!err && res && res.result && res.result.nModified == 0) {
            torrentdb.update({hash}, {$push: {files:{key, files, date: new Date()}}}, function (err, res) {
                console.log('push', err, res.result.nModified);
            });
        }
    });
    setTimeout(function() {
        torrent.deleteOldFile(req);
    }, 5000);
}

torrent.deleteOldFile = function(req, callback) {
    var db = req.app.locals.db;
    var torrentdb = db.collection('torrent');

    var date = new Date(new Date()-30*24*60*60*1000);
    torrentdb.find({"files.date":{$lt: date}}, {hash: 1, files:1}).toArray(function(err, doc) {
        if (!err && doc) {
            for (var i = 0; i < doc.length; i++) {
                for (var j = 0; j < doc[i].files.length; j++) {
                    if (doc[i].files[j].date < date) {
                        console.log('deleteOldFile key:', doc[i].files[j].key, doc[i].files[j].date);
                        var del =  doc[i].files[j].files;
                        if (del) {
                            for (let k = 0; k < del.length; k++) {
                                if (err != null && del[k] && fs.existsSync(del[k])) {
                                    console.log('Delete:', del[k]);
                                    fs.unlinkSync(del[k]);
                                }
                            }
                        }
                        else {
                            console.log('Error: cant delete:', doc[i].files[j]);
                        }
                        torrentdb.update({hash: doc[i].hash}, { $pull: { files: { key: doc[i].files[j].key, date: doc[i].files[j].date}}}, {multi: true}, function (err, res) {
                            console.log('deleted !', err, res.result.nModified);
                            utilsLib.cleanEmptyFoldersRecursively('torrent/');
                        });
                    }
                }
            }
        }
    });
}

module.exports = torrent;
