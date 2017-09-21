var fs = require('fs');
var logger = require('winston');
var Promise = require('bluebird');

Promise.promisifyAll(fs);

module.exports = function(Peer) {
	Peer.prototype.piece = function(msgBuffer) {
		var msgBufferHeader = msgBuffer.slice(0, 13); // 13 = header len
		var headerIndex = -1;

		for (var i = 0; i < this.currentPiece.blockQueue.length; i++) {
			if (this.currentPiece.blockQueue[i].compare(msgBufferHeader) == 0) {
				headerIndex = i;
				break;
			}
		}
		logger.debug(this.remoteClientHref, ': blockQueue received: ',
			this.currentPiece.blockQueue, 'msgBufferHead', msgBufferHeader);
		logger.debug('headerIndex: ' + headerIndex);

		// below is faster but work only if peer sent messages in order(from pipelined requests)
		// if (msgBuffer.compare(this.currentPiece.blockQueue[0], 0, 13, 0, 13) == 0) {
		if (headerIndex >= 0) {
			try {
				var piece = {
					len: msgBuffer.readUInt32BE(0) - 9,
					index: msgBuffer.readUInt32BE(5),
					begin: msgBuffer.readUInt32BE(9),
					dataBlock: msgBuffer.slice(13)
				}
			} catch (err) {
				logger.debug('Error on receivePiece from : ' + this.remoteClientHref + '(', err, ')');
				this.client.destroy();
				return ;
			}
			logger.debug('piece received from: ' + this.remoteClientHref + ', len: ' + piece.len +
				' index: ' + piece.index + ' begin: ' + piece.begin);
 
			this.currentPiece.blockQueue[headerIndex].data = piece.dataBlock;
			this.currentPiece.data = Buffer.concat([this.currentPiece.data,
				this.currentPiece.blockQueue[headerIndex].data]);
			var found = this.currentPiece.blockQueue.splice(headerIndex, 1);
			logger.debug('blockQueue found : ', found, '------------------');

			var pieceDataLen = Buffer.byteLength(piece.dataBlock);
			this.currentPiece.offset += pieceDataLen;
			this.bytesPerSecond += pieceDataLen;
		}
		else {
			logger.debug('Incorrect piece received : ', msgBuffer, ' from ' + this.remoteClientHref);
			this.client.destroy();
		}

		logger.debug('Current piece offset: ' + this.currentPiece.offset + ' - ' + 'piece length: ' +
				this.pieceLength);

		if (this.watchDlSpeed == false) {
			if (this.bt.peersAlivePieces.length < this.bt.MAX_ALIVE_PEERS) {
				this.bt.peersAlivePieces.push({
					'href': this.remoteClientHref,
					'nbPiecesDl': 0
				});
			}
			else
				this.client.destroy();
			this.watchDlSpeed = setInterval(() => {
				this.downloadSpeed = Math.round((this.bytesPerSecond / 5120) * 100) / 100;
				logger.verbose('(' + this.currentPiece.index + ') ' + this.remoteClientHref +
					' downloading at ' + this.downloadSpeed + ' Kb/s');
				if (this.downloadSpeed < 30 && this.amChoke == false) {	
					logger.verbose('kill ' + this.remoteClientHref + ' (connection too slow)');
					this.client.destroy();
				}
				this.bytesPerSecond = 0;
			}, 5000);
		}
		if (this.bt.begin == false)
			this.bt.begin = true;

		if (this.currentPiece.offset == this.pieceLength)
			this.pieceFinished();
		else if (this.currentPiece.blockQueue.length == 0)
			this.request();
	},
	Peer.prototype.request = function() {
		if (this.firstPieceRequest == true) {
			if (this.chosePiece() == -1)
				return ;
			this.firstPieceRequest = false;
		}

		this.currentPiece.blockQueue = [];
		var requestPiecesBuf = Buffer.alloc(0);

		logger.debug('currentPieceOffset before pipelining req: ' + this.currentPiece.offset +
			' - ' + this.pieceLength + '(' + this.currentPiece.index + ')');

		for (var i = 0, offset = this.currentPiece.offset; (i < 5) &&
				(offset < this.pieceLength); i++) {
			var requestPieceBuf = Buffer.alloc(17);
			var receivePieceBuf = Buffer.alloc(13); // buffer header of piece that need to be received
			receivePieceBuf[4] = 0x07;
			receivePieceBuf.writeUInt32BE(this.currentPiece.index, 5);

			this.bt.msg.REQUEST.copy(requestPieceBuf, 0);
			requestPieceBuf.writeUInt32BE(this.currentPiece.index, 5);

			requestPieceBuf.writeUInt32BE(offset, 9);
			receivePieceBuf.writeUInt32BE(offset, 9);
			var blockLen = this.BLOCK_PIECE_LEN;
			if (offset + this.BLOCK_PIECE_LEN > this.pieceLength) {
				blockLen = this.pieceLength - this.currentPiece.offset;
				logger.debug('last piece block (', this.currentPiece.index, ') : ',
					this.pieceLength - this.currentPiece.offset, ')');
			}
			requestPieceBuf.writeUInt32BE(blockLen, 13);
			receivePieceBuf.writeUInt32BE(blockLen + 9, 0);

			this.currentPiece.blockQueue.push(receivePieceBuf);

			requestPiecesBuf = Buffer.concat([requestPiecesBuf, requestPieceBuf]);
			offset += blockLen;
		}

		logger.debug('(' + this.currentPiece.index + ')' + ' send request message to: ' +
			this.remoteClientHref + ' : ', requestPiecesBuf);
		// logger.debug(this.remoteClientHref, ', sent blockQueue: ', this.currentPiece.blockQueue);
		logger.debug('Full request message: ', requestPiecesBuf.toString('hex'));

		this.client.write(requestPiecesBuf);
	},
	Peer.prototype.chosePiece = function() {
		var piece = -1;

		for (var i = 0; i < this.availablePieces.length; i++) {
		   if (this.bt.piecesDlIndex.indexOf(this.availablePieces[i]) == -1 &&
				this.bt.piecesBeingDlIndex.indexOf(this.availablePieces[i]) == -1) {
				this.currentPiece.index = this.availablePieces[i];
				piece = this.availablePieces[i];
				this.bt.piecesBeingDlIndex.push(piece);
				break ;
		   }
		}

		if (this.currentPiece.index == this.bt.metadata.pieces.length - 1)
			this.pieceLength = this.bt.metadata.lastPieceLength;
		if (piece == -1) {
			logger.debug('Cannot chose a piece from: ' + this.remoteClientHref);
			this.client.destroy();
		}
		return (piece);
	},
	Peer.prototype.pieceFinished = function() {
		if (require('crypto').createHash('sha1').update(this.currentPiece.data).digest('hex') ==
			this.bt.metadata.pieces[this.currentPiece.index]) {
			this.downloadedBytes += this.pieceLength;
			if (this.currentPiece.index == this.bt.metadata.pieces.length - 1)
				this.pieceLength = this.bt.metadata.pieceLength;

			logger.verbose('piece (' + this.currentPiece.index + ') finished by ' + this.remoteClientHref);
			for (var i = 0; i < this.bt.peersAlivePieces.length; i++) {
				if (this.bt.peersAlivePieces[i].href == this.remoteClientHref)
					this.bt.peersAlivePieces[i].nbPiecesDl++;
			}
			this.bt.piecesBeingDlIndex.splice(this.bt.piecesBeingDlIndex.indexOf(this.currentPiece.index), 1);
			this.bt.piecesDlIndex.push(this.currentPiece.index);
			this.writeToFiles();
			this.currentPiece.offset = 0;
			this.currentPiece.data = Buffer.alloc(0);
			this.firstPieceRequest = true;

			this.request();
		}
		else {
			logger.debug('Cannot verify sha1 of piece nb ' + this.currentPiece.index);
			this.client.destroy();
		}
	},
	Peer.prototype.writeToFiles = function() {
		for (var i = 0; i < this.bt.files.length; i++) {
			var pieceIndex = -1;
			this.bt.files[i].pieces.forEach((piece, index) => {
				if (this.currentPiece.index == piece.index)
					pieceIndex = index;
			});
			if (pieceIndex >= 0) {
				logger.debug(this.remoteClientHref, ', found piece: ', pieceIndex);
				var dataToInsert = this.currentPiece.data.slice(this.bt.files[i].pieces[
					pieceIndex].begin, this.bt.files[i].pieces[pieceIndex].end);
				this.bt.files[i].pieces[pieceIndex].data = dataToInsert;
				this.bt.files[i].pieces[pieceIndex].dl = true;

				logger.debug('Data len to write: ' + Buffer.byteLength(dataToInsert) + ' from: '
					+ Buffer.byteLength(this.currentPiece.data));

				for (var k = 0; k < this.bt.files[i].pieces.length; k++) {
					while (typeof this.bt.files[i].pieces[k] !== 'undefined' &&
						typeof this.bt.files[i].pieces[k + 1] !== 'undefined' &&
						this.bt.files[i].pieces[k].dl == true && this.bt.files[i].pieces[k + 1].dl == true) {

						this.bt.files[i].pieces[k].data = Buffer.concat([
							this.bt.files[i].pieces[k].data, this.bt.files[i].pieces[k + 1].data
						]);
						this.bt.files[i].pieces.splice(k + 1, 1);
					}
				}
				var alignPiecesNb = 0;
				while (typeof this.bt.files[i].pieces[alignPiecesNb] !== 'undefined' &&
					this.bt.files[i].pieces[alignPiecesNb].dl == true) {
					logger.silly('alignPiecesNb: ' + alignPiecesNb);
					alignPiecesNb++;
				}

				if (alignPiecesNb > 0) {
					// if buffer too long(cannot be > 1073741823 (1Go)) make mutliple appendFile
					var bufAppend = Buffer.alloc(0);
					for (var j = 0; j < alignPiecesNb; j++) {
						bufAppend = Buffer.concat([bufAppend, this.bt.files[i].pieces[j].data]);
						logger.silly('Concatenating: ' + this.bt.files[i].pieces[j].index);
					}
					((i) => {
						this.bt.files[i].fifoWorker.queue(fs.appendFileAsync(this.bt.files[i].dlPath, bufAppend));
						this.bt.files[i].currentLen += Buffer.byteLength(bufAppend);

						for (var j = 0; j < alignPiecesNb; j++)
								this.bt.files[i].pieces.shift();
						if (this.bt.files[i].pieces.length == 0) {
							logger.info(this.bt.files[i].dlPath + ' finished !');
							this.bt.streamEmitter.emit('pieceExchangeFinished', this.bt.files[i]);

							if (this.bt.piecesDlIndex.length == this.bt.pieces.length) {
								logger.info('Torrent download of ' + this.bt.metadata.name + ' finished');
								this.bt.torrentFinished = true;
								this.client.destroy();
							}
						}
						else if (this.bt.files[i].started == false) {
							this.bt.files[i].started = true;
							this.bt.streamEmitter.emit('pieceExchangeStarted', this.bt.files[i]);
						}
					})(i);
				}
			}
			else {
				// logger.verbose(this.remoteClientHref + ' : Cannot find piece nb ' + this.currentPiece.index);
			}
		}
	}
}
