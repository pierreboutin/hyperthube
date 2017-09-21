var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var url = require('url');
var logger = require('winston');
var Promise = require('bluebird');
var request = Promise.promisify(require('request'), {multiArgs: true});

Promise.promisifyAll(fs);
Promise.promisifyAll(request, {multiArgs: true});

module.exports = function(Bittorrent) {
	Bittorrent.prototype.webseed = function() {
		var seedUrls = [];

		this.metadata.urlList.forEach((urlList) => {
			this.files.forEach((file, i) => {
				var urlCheck = url.parse(urlList + file.path);
				if (urlCheck.hostname != null) {
					var noDuplicateFile = (seedUrl) => seedUrl.indexOf(file.name) == -1;
					if (seedUrls.every(noDuplicateFile))
						seedUrls.push(urlList + file.path);
				}
			});
		});
		logger.debug('Seed urls : ', seedUrls);
		if (seedUrls.length == 0) {
			logger.warn('Webseeding, No valid url from urlList');
			this.startTrackers();
			return ;
		}
		// example error: metroid file

		var reqPromises = [];
		var filesPath = [];
		var currentOffset = 0;
		var _this = this;
		for (let i = 0; i < seedUrls.length; i++) {
			reqPromise = new Promise((resolve, reject) => {
				filesPath.push(_this.files[i].dlPath);
				_this.files[i].started = true;
				_this.files[i].currentLen = 0; // fix may not be stable
				_this.streamEmitter.emit('pieceExchangeStarted', _this.files[i]);
				var streamBytes = fs.createWriteStream(_this.files[i].dlPath);
				streamBytes.on('pipe', (readableData) => {
					readableData.on('data', (chunk) => {
						_this.files[i].currentLen += Buffer.byteLength(chunk);
					});
				});
	            request.get({url: seedUrls[i], encoding: null}, (err, res) => {
	            	if (err)
						reject();
	            	else
	            		resolve();
	            }).pipe(streamBytes);

	            currentOffset += _this.files[i].length;
	        });
			reqPromises.push(reqPromise);
		}

		Promise.all(reqPromises).then(function() {
			// verify files integrity
			_this.files.forEach((file) => {
				_this.streamEmitter.emit('pieceExchangeFinished', file);
			});
		}).catch((err) => {
			logger.error('Webseeding: ' + err);

			if (_this.filesCheck() == -1)
				return ;
			else
				_this.startTrackers();
		}).catch((err) => {
			logger.error(err);
		});
	}
}
