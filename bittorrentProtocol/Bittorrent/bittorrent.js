var path = require('path');
var fs = require('fs');
var url = require('url');
var crypto = require('crypto');
var EventEmitter = require('events');
var logger = require('winston');
var Promise = require('bluebird');
var mkdirp = require('mkdirp');
var parseTorrentFile = require('parse-torrent-file');

Promise.promisifyAll(fs);

class StreamEventEmitter extends EventEmitter {}

var Bittorrent = function(torrentPath, opt_mdFilesPath) {
	// nt streaming arg (if not true it will be faster)
	this.torrentPath = torrentPath;
	this.metadata = null;
	if (typeof opt_mdFilesPath !== 'undefined')
		this.files = opt_mdFilesPath;
	else
		this.files = [];
	this.httpTracker = [];
	this.udpTracker = [];
	this.peersAlive = 0;
	this.peersTotal = 0;
	this.trackerRefreshTime = null;
	this.trackersRetry = 0;
	this.trackersTested = false;

	this.peersAlivePieces = [];
	this.piecesDlIndex = [];
	this.piecesBeingDlIndex = [];
	this.piecesIndexToDl = [];
	this.pieces = [];

	// this.torrentRootDir = '/Users/rporcon/Desktop/myGoinfre';
	this.torrentRootDir = './torrent/downloaded';
	this.dlTorrentDir = null;
	this.dlTorrentDirName = null;
	this.receivingPieceBlock = false;
	this.downloadedBytes = 0;
	this.peers = [];
	this.MAX_ALIVE_PEERS = 500;

	this.begin = false;
	this.peerId = null;
	this.streamEmitter = new StreamEventEmitter();
	this.torrentFinished = false;

	this.msg = {
		HANDSHAKE: Buffer.concat([Buffer.from([19]), Buffer.from('BitTorrent protocol')]),
		KEEP_ALIVE: Buffer.from([0x00, 0x00, 0x00, 0x00]),
		CHOKE: Buffer.from([0x00, 0x00, 0x00, 0x01, 0x00]),
		UNCHOKE: Buffer.from([0x00, 0x00, 0x00, 0x01, 0x01]),
		INTERESTED: Buffer.from([0x00, 0x00, 0x00, 0x01, 0x02]),
		UNINTERESTED: Buffer.from([0x00, 0x00, 0x00, 0x01, 0x03]),
		HAVE: Buffer.from([0x00, 0x00, 0x00, 0x05, 0x04]),
		REQUEST: Buffer.from([0x00, 0x00, 0x00, 0x0d, 0x06]),
		CANCEL: Buffer.from([0x00, 0x00, 0x00, 0x0d, 0x08]),
		PORT: Buffer.from([0x00, 0x00, 0x00, 0x03, 0x09])
	}
}

Bittorrent.prototype.init = function() {
	fs.readFileAsync(path.resolve(this.torrentPath)).then((torrentFile) => {
		this.metadata = parseTorrentFile(torrentFile);
		// console.log(this.metadata, 'nb of pieces to get: ', this.metadata.pieces.length);

		this.dlTorrentDirName = this.metadata.info.name.toString().replace(/\s+/g, '_') + '-'
			+ this.metadata.infoHash;
		if (this.files.length > 0) {
			if (this.getFilesData() == -1)
				return ;
		}
		else
			this.files = this.metadata.files;
		this.dlTorrentDir = this.torrentRootDir + '/' + this.dlTorrentDirName;

		if (fs.existsSync(path.resolve(this.torrentRootDir)) == false)
			fs.mkdirSync(path.resolve(this.torrentRootDir));
		if (this.dlTorrentDirName != null && fs.existsSync(this.dlTorrentDir) == false)
			fs.mkdirSync(path.resolve(this.dlTorrentDir));

		for (var i = 0; i < this.files.length; i++) {
			var dirNames = this.files[i].path.split('/');
			if (dirNames.length > 1)
				dirNames.pop();
			var dlDir = this.files[i].path.indexOf('/') >= 0 ? '/' + dirNames.join('/') : '';
			var fileDlPath = path.resolve(this.dlTorrentDir + dlDir);

			mkdirp.sync(fileDlPath);
			this.files[i].dlPath = fileDlPath + '/' + this.files[i].name;
			this.files[i].relativeDlPath = this.dlTorrentDir + dlDir;
			this.files[i].started = false;
			this.files[i].timerStart = null;
			this.files[i].fifoWorker = new this.FifoWorker();
			this.files[i].currentLen = 0;
			this.files[i].data = Buffer.alloc(0);
		}
		this.piecesToGet();
		if (this.filesCheck() == -1)
			return ;

		if (typeof this.metadata.urlList !== 'undefined' && this.metadata.urlList.length > 0)
			this.webseed();
		else {
			this.peerId = '-HT0101-' + crypto.randomBytes(6).toString('hex');
			this.startTrackers();
		}
	}).catch((err) => {
		logger.warn('Something wrong happened on init of file ' + this.torrentPath +
			' : ' + err);
	});
}

Bittorrent.prototype.startTrackers = function() {
	var trackerIndex = -1;
	var reqTrackersPromises = [];

	for (var i = 0; i < this.metadata.announce.length; i++)  {
		var parsedAnnounceUrl = url.parse(this.metadata.announce[i]);

		// on n peersHost, successfull connection on n host(for stats)
		if (parsedAnnounceUrl.protocol == 'http:') {
			this.httpTracker.push({url: parsedAnnounceUrl.href});
			trackerIndex = this.httpTracker.length - 1;

			this.httpTracker[trackerIndex].index = trackerIndex;
			this.httpTracker[trackerIndex].firstCall = true;

			reqTrackersPromises.push(this.reqHttpTracker(this.httpTracker[trackerIndex]));
		}
		else if (parsedAnnounceUrl.protocol == 'udp:') {
			this.udpTracker.push({
				hostname: parsedAnnounceUrl.hostname,
				port: parsedAnnounceUrl.port
			});
			trackerIndex = this.udpTracker.length - 1;

			this.udpTracker[trackerIndex].index = trackerIndex;
			this.udpTracker[trackerIndex].firstCall = true;

			reqTrackersPromises.push(new Promise((resolve) => {
				this.reqUdpTracker(this.udpTracker[trackerIndex], function() {
					resolve();
				});
			}));
		}
	}
	Promise.all(reqTrackersPromises).then(() => {
		this.trackersTested = true;
		logger.debug('All trackers tested');

		if (this.httpTracker.every(tracker => tracker == null) &&
			this.udpTracker.every(tracker => tracker == null)) {
			logger.warn('All trackers seems offline');
			/*if (this.trackersRetry < 10) {
				setTimeout(() => {this.startTrackers();}, 60 * 1000);
				this.trackersRetry++;
			}*/
		}
	});
}

Bittorrent.prototype.piecesToGet = function() {
	for (var i = 0; i < this.files.length; i++) {
		var pieceLength = this.metadata.pieceLength;
		var fileFirstPiece = this.files[i].offset - (this.files[i].offset % pieceLength);
		if (isNaN(fileFirstPiece))
			fileFirstPiece = 0;
		var filesOffset = this.files[i].offset + this.files[i].length;

		if (filesOffset % pieceLength == 0)
			var fileLastPiece = this.files[i].offset + this.files[i].length;
		else
			var fileLastPiece = filesOffset + (pieceLength - (filesOffset % pieceLength));
		this.files[i].pieces = [];

		for (var k = 0, j = fileFirstPiece; j < fileLastPiece; k++, j += pieceLength) {
			var piece = j / pieceLength;

			if (this.pieces.indexOf(piece) == -1)
				this.pieces.push(piece);
			this.files[i].pieces.push({index: piece});
			this.files[i].pieces[k].data = Buffer.alloc(0);
			this.files[i].pieces[k].dl = false;
		}
		if (this.files[i].pieces.length == 1) {
			var begin = this.files[i].offset - (this.files[i].pieces[0].index * pieceLength);
			var end = begin + this.files[i].length;

			this.files[i].pieces[0].begin = begin;
			this.files[i].pieces[0].end = end;
		}
		else if (this.files[i].pieces.length == 2) {
			var firstBegin = this.files[i].offset - (this.files[i].pieces[0].index * pieceLength);
			var secondEnd = (this.files[i].offset + this.files[i].length) -
				(this.files[i].pieces[1].index * pieceLength);

			this.files[i].pieces[0].begin = firstBegin;
			this.files[i].pieces[0].end = pieceLength;
			this.files[i].pieces[1].begin = 0;
			this.files[i].pieces[1].end = secondEnd;
		}
		else if (this.files[i].pieces.length > 2) {
			var firstBegin = this.files[i].offset - (this.files[i].pieces[0].index * pieceLength);
			var lastBegin = this.files[i].pieces[this.files[i].pieces.length - 1].index * pieceLength;
			var lastEnd = (this.files[i].offset + this.files[i].length) -
				this.files[i].pieces[this.files[i].pieces.length - 1].index * pieceLength;

			this.files[i].pieces[0].begin = firstBegin;
			this.files[i].pieces[0].end = pieceLength;

			for (var k = 1, j = this.files[i].pieces[1].index * pieceLength;
				j < lastBegin; j += pieceLength, k++) {
				this.files[i].pieces[k].begin = 0;
				this.files[i].pieces[k].end = pieceLength;
			}
			this.files[i].pieces[this.files[i].pieces.length - 1].begin = 0;
			this.files[i].pieces[this.files[i].pieces.length - 1].end = lastEnd;
		}
		// console.log(this.files[i]);
	}
}

Bittorrent.prototype.checkPieces = function(fileSize, file) {
	// will not work properly in certain case of multiple files
	// because for a file i do not keep an entire piece but only keep what needed(slice)
	// verify piece length if len not good delete piece
	for (var i = 0; i < fileSize; i += file.pieces[0].end - file.pieces[0].begin) {
		// console.log(file.pieces[0], i, fileSize);
		if (this.piecesDlIndex.indexOf(file.pieces[0].index) < 0) {
			var fileCurrentLen = i;

			file.currentLen = fileCurrentLen;
			this.piecesDlIndex.push(file.pieces[0].index);
			file.pieces.shift();
		}
	}
	// console.log(this.piecesDlIndex, file.pieces);
}

Bittorrent.prototype.filesCheck = function() {
	for (var i = 0; i < this.files.length; i++) {
		if (fs.existsSync(this.files[i].dlPath) == true) {
			var statFile = fs.statSync(this.files[i].dlPath);

			if (statFile.size == this.files[i].length) {
				this.streamEmitter.emit('pieceExchangeFinished', this.files[i]);
				this.files.splice(i, 1);
			}
			else {
				// do not work atm for multiple files (retrieve last pieces dl)
				if (i == 0) {
					this.checkPieces(statFile.size, this.files[i]);
					logger.verbose('file: ' + this.files[i].dlPath + ' partially exist, found ' +
						this.piecesDlIndex.length + ' already dl');
				} else {
					logger.verbose('file partially exist ' + this.files[i].dlPath + ', delete + restart');
					fs.unlinkSync(this.files[i].dlPath);
				}
			}
		}
	}
	if (this.files.length == 0)
		return (-1);
	return (0);
}

Bittorrent.prototype.started = function(cb) {
	this.streamEmitter.on('pieceExchangeStarted', function(file) {
		file.timerStart = new Date();
		var fileInfo = {
			path: file.relativeDlPath,
			finalLen: file.length,
			name: file.name
		}

		logger.verbose('peers piece exchange of file: ' + file.path + ' [started]');
		cb(fileInfo);
	});
}

Bittorrent.prototype.finished = function(cb) {
	this.streamEmitter.on('pieceExchangeFinished', function(file) {
		var totalTime = '';

		if (file.timerStart != null) {
			var end = new Date();
			var sec = ((end.getTime() - file.timerStart.getTime()) / 1000) % 60;
			var min = (end.getTime() - file.timerStart.getTime()) / 60000;

			var elapsedTime = Math.round(min) + ' min and ' + Math.round(sec) + ' sec';

			totalTime = 'Duration : ' + file.name + ' : ' + elapsedTime;
		}
		var fileInfo = {
			path: file.relativeDlPath,
			finalLen: file.length,
			name: file.name
		}

		logger.verbose('peers piece exchange of file: ' + file.dlPath + ' [finished] ' +
			totalTime);
		cb(fileInfo);
	});
}	

Bittorrent.prototype.currentLen = function(filesPath, cb) {
	if (typeof filesPath === 'object') {
		filesPath.forEach((filePath) => {
			this.files.forEach((file) => {
				if (filePath == file.path && file.started == true) {
					cb(file.currentLen);
				}
			});
		});
	}
}

Bittorrent.prototype.getFilesData = function() {
	var _this = this;
	var filesAsked = [];

	for (var i = 0; i < _this.files.length; i++) {
		for (var j = 0; j < _this.metadata.files.length; j++) {
			if (_this.files[i] == _this.metadata.files[j].path)
				filesAsked.push(_this.metadata.files[j]);
		}
	}
	if (filesAsked.length == 0 || filesAsked.length != _this.files.length) {
		logger.warn('Cannot find files ' + _this.files + ' in torrent');
		return (-1);
	}
	_this.files = filesAsked;
	return (0);
}


require('./utils.js')(Bittorrent);

require('./webseed.js')(Bittorrent);

require('./tracker.js')(Bittorrent);

module.exports = Bittorrent;

/* function scrapeConvention(anUrl, metadata) {
	// (not implemented by everyone)
	if (anUrl.pathname.split('/')[anUrl.pathname.split('/').length - 1]
		=== 'announce') {
		var reqanUrl = anUrl.href.replace(anUrl.pathname.split('/'
			)[anUrl.pathname.split('/').length - 1], 'scrape');
		// check tracker scrape
	}
} */
