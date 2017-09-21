var net = require('net');
var logger = require('winston');
var Promise = require('bluebird');

Promise.promisifyAll(net);

var Peer = function(peerHost, bittorent) {
	this.client = new net.Socket();
	this.port = parseInt(peerHost.split(':')[1]);
	this.addr = peerHost.split(':')[0];
	this.remoteClientHref = this.addr + ':' + this.port;
	this.peerAliveIndex = 0;

	this.receivedHandshake = false;
	this.receivedBitfield = false;

	this.downloadSpeed = 0;
	this.bytesPerSecond = 0;
	this.watchDlSpeed = false;

	this.amChoke = false;
	this.peerAllPieces = false;
	this.firstPieceRequest = true;
	this.BLOCK_PIECE_LEN = Math.pow(2, 14);

	this.availablePieces = [];
	this.currentPiece = {
		index: -1,
		offset: 0,
		blockQueue: [],
		data: Buffer.alloc(0)
	};
	this.pieceLength = bittorent.metadata.pieceLength;
	this.bt = bittorent;
}

Peer.prototype.initConn = function() {
	var msgLen = 0;
	var buffer = Buffer.alloc(0);
	var bufferLen = 0;

	this.client.setTimeout(30000);
	this.bt.peersAlive++;

	logger.verbose('Tryin to connect to: ', this.addr + ':' + this.port);
	this.client.connectAsync(this.port, this.addr).then(() => {
		this.remoteClientHref = this.client.remoteAddress + ':' + this.client.remotePort;
		logger.debug('Connected to remote client: ', this.remoteClientHref);
		this.sendHandshake();
	}).catch((err) => {
		logger.debug('Cannot connect to: ' + this.remoteClientHref + ' (' + err + ')');
		this.client.destroy();
	});

	this.client.on('data', (rawBuffer) => {
		buffer = Buffer.concat([buffer, rawBuffer]);
		bufferLen = Buffer.byteLength(buffer);

		logger.silly('(' + this.currentPiece.index + ') received DATA from ' + this.remoteClientHref +
			' : ', rawBuffer, ', length: ' + Buffer.byteLength(rawBuffer) + ' { ' + this.currentPiece.offset +
			'-' + this.pieceLength + '}');
		// logger.silly('buffer: ' + buffer.toString('hex') + ', bufferLen: ' + bufferLen);

		if (msgLen == 0) {
			if (Buffer.byteLength(rawBuffer) >= 4)
				msgLen = this.messageLen(rawBuffer);
			else {
				msgLen = 0;
				return ;
			}
		}

		if (bufferLen == msgLen) {
			// full message(header + data)
			this.messages(buffer, msgLen);
			buffer = Buffer.alloc(0);
			bufferLen = 0;
			msgLen = 0;
		} else if (bufferLen > msgLen) {
			// multiples messages + data
			while (bufferLen >= msgLen) {
				var msgBuffer = buffer.slice(0, msgLen);
				this.messages(msgBuffer, msgLen);
				// logger.silly('multiples, BufferLen: ' + bufferLen + ' msgLen: ' + msgLen);
				// logger.silly('buffer: ' + buffer.toString('hex') + ', ' + msgBuffer.toString('hex'));
				if (bufferLen == msgLen) {
					buffer = Buffer.alloc(0);
					bufferLen = 0;
					msgLen = 0;
					break ;
				}
				buffer = buffer.slice(msgLen, bufferLen);
				bufferLen = Buffer.byteLength(buffer);
				if (Buffer.byteLength(buffer) >= 4)
					msgLen = this.messageLen(buffer);
				else {
					msgLen = 0;
					break ;
				}
			}
		}
	});
	this.client.on('timeout', (err) => {
		logger.debug('Client timeout: ' + this.remoteClientHref);
		if (this.client.destroyed == false)
			this.client.destroy();
	});

	this.client.on('error', (err) => {
		logger.debug('Client error: ' + this.remoteClientHref + '(', err, ')');
		if (this.client.destroyed == false)
			this.client.destroy();
	});

	this.client.on('close', () => {
		this.bt.peersAlive--;	
		this.bt.checkTrackers();

		if (this.watchDlSpeed != false)
			clearInterval(this.watchDlSpeed);
		if (this.client.destroyed == false)
			this.client.destroy();
		if (this.bt.piecesBeingDlIndex.indexOf(this.currentPiece.index) >= 0)
			this.bt.piecesBeingDlIndex.splice(this.bt.piecesBeingDlIndex.indexOf(this.currentPiece.index), 1);

		logger.debug('Max peers: ', this.bt.peersAlive, '---', this.bt.peersTotal,
			'tested:', this.bt.trackersTested, 'finished: ', this.bt.torrentFinished);
		if (this.bt.trackersTested == true && this.bt.peersAlive < Math.round(this.bt.peersTotal / 3) &&
				this.bt.torrentFinished == false && (this.bt.trackerRefreshTime == null ||
				((new Date().getTime() - this.bt.trackerRefreshTime) / 1000) >= 10)) {

			logger.verbose('[Refresh tracker], total peers: ' + this.bt.peersTotal +
				' , peers alive: ' + this.bt.peersAlive);
			this.bt.refreshTrackers(0);
			this.bt.trackerRefreshTime = new Date().getTime();
		}
		for (var i = 0; i < this.bt.peersAlivePieces.length; i++) {
			if (this.bt.peersAlivePieces[i].href == this.remoteClientHref)
				this.bt.peersAlivePieces.splice(i, 1);
		}
		if (this.bt.started == true && this.bt.peersAlivePieces.byteLength == 0) {
			logger.verbose('No peers alive');
			// relaunch torrent ?
		}
		logger.debug('Connection closed: ' + this.remoteClientHref);
	});
}

require('./messages.js')(Peer);

require('./pieces.js')(Peer);

module.exports = Peer;