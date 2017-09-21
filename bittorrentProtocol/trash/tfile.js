var path = require('path');
var fs = require('fs');
var crypto = require('crypto');
var logger = require('winston');
var Promise = require('bluebird');

module.exports = function(Bittorrent) {
	Bittorrent.prototype.checkPieces = function(file) {
		for (var i = 0; i < this.metadata.pieces.length - 1; i++) {
			var piece = file.slice(i * this.metadata.pieceLength, (i + 1) * this.metadata.pieceLength);
			var pieceHash = crypto.createHash('sha1').update(piece).digest('hex');
			var pieceIndex = this.metadata.pieces.indexOf(pieceHash);

			if (pieceIndex >= 0) {
				this.fileOffset += Buffer.byteLength(piece);
				this.piecesDlIndex.push(pieceIndex);
				// logger.debug('Piece nb ' + pieceIndex + ' already downloaded');
			}
		}
		// if (fs.existsSync(this.lastPiecePath)) {
		// 	var lastPiece = fs.readFileSync(this.lastPiecePath);
		// 	var lastPieceHash = crypto.createHash('sha1').update(lastPiece).digest('hex');
		// 	var lastPieceIndex = this.metadata.pieces.indexOf(lastPieceHash);

		// 	if (lastPieceIndex >= 0) {
		// 		this.fileOffset += Buffer.byteLength(lastPiece);
		// 		this.piecesDlIndex.push(lastPieceIndex);
		// 		// logger.debug('Last piece nb ' + lastPieceIndex + ' already downloaded');
		// 	}
		// }
		if (this.piecesDlIndex.length > 0) {
			logger.debug('Already downloaded ' + this.piecesDlIndex.length +
				' pieces out of ' + this.metadata.pieces.length);
		}
	}	
	// Bittorrent.prototype.checkPieces = function(file) {
	// 	for (var i = 0; i < this.metadata.pieces.length - 1; i++) {
	// 		var piece = file.slice(i * this.metadata.pieceLength, (i + 1) * this.metadata.pieceLength);
	// 		var pieceHash = crypto.createHash('sha1').update(piece).digest('hex');
	// 		var pieceIndex = this.metadata.pieces.indexOf(pieceHash);

	// 		if (pieceIndex >= 0) {
	// 			this.fileOffset += Buffer.byteLength(piece);
	// 			this.piecesDlIndex.push(pieceIndex);
	// 			// logger.debug('Piece nb ' + pieceIndex + ' already downloaded');
	// 		}
	// 	}
	// 	if (fs.existsSync(this.lastPiecePath)) {
	// 		var lastPiece = fs.readFileSync(this.lastPiecePath);
	// 		var lastPieceHash = crypto.createHash('sha1').update(lastPiece).digest('hex');
	// 		var lastPieceIndex = this.metadata.pieces.indexOf(lastPieceHash);

	// 		if (lastPieceIndex >= 0) {
	// 			this.fileOffset += Buffer.byteLength(lastPiece);
	// 			this.piecesDlIndex.push(lastPieceIndex);
	// 			// logger.debug('Last piece nb ' + lastPieceIndex + ' already downloaded');
	// 		}
	// 	}
	// 	if (this.piecesDlIndex.length > 0) {
	// 		logger.debug('Already downloaded ' + this.piecesDlIndex.length +
	// 			' pieces out of ' + this.metadata.pieces.length);
	// 	}
	// }
	/*
	Bittorrent.prototype.sortPieces = function() {
		var _this = this;
		var downloadedPieces = [];
		var file = fs.readFileSync(_this.tmpFilePath);
		var fileOffset = 0;

		for (var i = 0; i < _this.metadata.pieces.length - 1; i++) {
			var piece = file.slice(i * _this.metadata.pieceLength, (i + 1) * _this.metadata.pieceLength);
			var pieceHash = crypto.createHash('sha1').update(piece).digest('hex');
			var pieceIndex = _this.metadata.pieces.indexOf(pieceHash);

			if (pieceIndex >= 0) {
				downloadedPieces.push({
					index: pieceIndex,
					data: piece
				});
				fileOffset += Buffer.byteLength(piece);
				// logger.debug('Piece nb ' + pieceIndex + ' already downloaded');
			}
		}
		if (fs.existsSync(_this.lastPiecePath)) {
			var lastPiece = fs.readFileSync(_this.lastPiecePath);
			var lastPieceHash = crypto.createHash('sha1').update(lastPiece).digest('hex');
			var lastPieceIndex = _this.metadata.pieces.indexOf(lastPieceHash);

			if (lastPieceIndex >= 0) {
				downloadedPieces.push({
					index: lastPieceIndex,
					data: lastPiece
				});
				fileOffset += Buffer.byteLength(lastPiece);
				// logger.debug('Last piece nb ' + lastPieceIndex + ' already downloaded');
			}
		}
		if (_this.piecesDlIndex.length > 0) {
			logger.debug('Downloaded ' + _this.piecesDlIndex.length +
				' out of ' + _this.metadata.pieces.length)
		}

		downloadedPieces.sort(function(a, b) {
			return (a.index - b.index);
		});

		if (fileOffset == _this.fileOffsetBegin + _this.fileLength &&
			downloadedPieces.length == _this.metadata.pieces.length) {
			var newFilePath = _this.tmpFilePath.replace(_this.tmpFilePath,
				_this.tmpFilePath.replace('_hashCheck_', ''));

			return Promise.mapSeries(downloadedPieces, function(downloadedPiece) {
				return fs.appendFileAsync(path.resolve(newFilePath),
					downloadedPiece.data, 'binary');
			}).then(function() {
				return fs.unlinkAsync(_this.lastPiecePath).catch(function(err) {
					logger.warn('Cannot delete file: ' + _this.lastPiecePath);
				});
			});
		}
		else
			return Promise.reject('Incomplete file: ' + _this.tmpFilePath);
	},
	Bittorrent.prototype.complete = function() {
		var _this = this;

		if (_this.metadata.files.length == 1) {
			logger.info('Files successfully created from ' + _this.tmpFilePath);
			_this.bt.emitter.emit('pieceExchangeFinished', _this.tmpFilePath.replace('_hashCheck_', ''));
			return fs.unlinkAsync(_this.tmpFilePath).catch(function(err) {
				logger.warn('Cannot delete file: ' + _this.tmpFilePath);
			});
		}
		else if (_this.metadata.files.length > 1) {
			var promises = [];
			var file = fs.readFileSync(_this.tmpFilePath.replace('_hashCheck_', ''));

			for (var i = 0; i  < _this.metadata.files.length; i++) {
				var filePath = path.resolve(_this.dlTorrentRootDir + '/' + _this.dirName +
					'/' + _this.metadata.files[i].name);

				if (i == _this.metadata.files.length - 1) {
					promises.push(fs.appendFileAsync(filePath, file.slice(
						_this.metadata.files[i].offset, _this.metadata.files[i].offset +
						_this.metadata.files[i].length), 'binary')
					);
				}
				else {
					promises.push(fs.appendFileAsync(filePath, file.slice(
						_this.metadata.files[i].offset, _this.metadata.files[i + 1].offset), 'binary')
					);
				}
			}
			return Promise.all(promises).catch(function(err) {
				logger.error('Files creation from ' + _this.tmpFilePath + ' failed');
			}).then(function() {
				logger.info('Files successfully created from ' + _this.tmpFilePath);
				_this.bt.emitter.emit('pieceExchangeFinished', 'O_O bonjour toi'/*must be arrays of all path);
				return fs.unlinkAsync(_this.tmpFilePath).catch(function(err) {
					logger.warn('Cannot delete file: ' + _this.tmpFilePath);
				});
			}).catch(function(err) {
				logger.warn('Cannot delete file: ' + _this.tmpFilePath);
			});
		}
	}
	*/
}