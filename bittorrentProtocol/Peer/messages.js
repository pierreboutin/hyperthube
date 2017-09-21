var logger = require('winston');

module.exports = function(Peer) {
	Peer.prototype.messageLen = function(msgBuffer) {
		var msgLen = 0;

		if (this.receivedHandshake == false) {
			msgLen = 68;
		} else {
			msgLen = msgBuffer.readUInt32BE(0) + 4;
			logger.silly('Msg len: ' + msgLen);
		}
		return (msgLen);
	},
	Peer.prototype.messages = function(msgBuffer, msgLen) {
		var msgId = msgBuffer[4];
		var msg = msgBuffer.slice(0, 5);

		logger.debug('(' + this.currentPiece.index + ') received MESSAGE from ' + this.remoteClientHref +
			' : ', msgBuffer, ', length: ' + Buffer.byteLength(msgBuffer) + ' { ' + this.currentPiece.offset +
			'-' + this.pieceLength + '}');
		// logger.silly(msgBuffer.toString('hex'));

		if (this.receivedHandshake == false && msgBuffer.compare(this.bt.msg.HANDSHAKE, 0, Buffer.byteLength(
				this.bt.msg.HANDSHAKE), 0, Buffer.byteLength(this.bt.msg.HANDSHAKE)) == 0) {
			logger.debug('[handshake]');
			this.handshake(msgBuffer);
			this.receivedHandshake = true;
		} else if (this.receivedBitfield == false && msgId == 0x05) {
			// sent directly after handshake (verify)
			logger.debug('[bitfield]');
			this.bitfield(msgBuffer, msgLen);
			this.receivedBitfield = true;
		} else if (msgId == 0x07) {
			logger.debug('[piece]');
			this.piece(msgBuffer);
		} else if (msg.compare(this.bt.msg.KEEP_ALIVE) == 0) {
			logger.debug('[keep alive]');
		} else if (msg.compare(this.bt.msg.CHOKE) == 0 && this.amChoke == false) {
			logger.debug('[choke]');
			this.amChoke = true;
		} else if (msg.compare(this.bt.msg.UNCHOKE) == 0) {
			logger.debug('[unchoke]');
			this.amChoke = false;
			this.request();
		} else if (msg.compare(this.bt.msg.INTERESTED) == 0) {
			logger.debug('[interested]');
			// seed case
		} else if (msg.compare(this.bt.msg.UNINTERESTED) == 0) {
			logger.debug('[uninterested]');
			// seed case
		} else if (this.peerAllPieces == false && msg.compare(this.bt.msg.HAVE) == 0) {
			logger.debug('[have]');
			this.have(msgBuffer);
		} else if (msg.compare(this.bt.msg.REQUEST) == 0) {
			logger.debug('[request]');
			// seed case
		} else if (msg.compare(this.bt.msg.CANCEL) == 0) {
			logger.debug('[cancel]');
			// ??
		} else if (msg.compare(this.bt.msg.PORT) == 0) {
			logger.debug('[port]');
			// seed case
		}
		else {
			logger.debug('[Unknown message]');
			this.client.destroy();
		}
	},
	Peer.prototype.sendHandshake = function() {
		var handshake = {
			pstrlen: Buffer.from([19]),
			pstr: Buffer.from('BitTorrent protocol'),
			reserved: Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]),
			infoHash: Buffer.from(this.bt.metadata.infoHash, 'hex'),
			peerId: Buffer.from(this.bt.peerId)
		};
		var handshakeBuffer = Buffer.concat([handshake.pstrlen, handshake.pstr,
			handshake.reserved, handshake.infoHash, handshake.peerId]);

		logger.debug('Sending handshake to ' + this.remoteClientHref);
		this.client.write(handshakeBuffer);
	},
	Peer.prototype.handshake = function(msgBuffer) {
		try {
			// handshake size = 68 bytes
			var handshake = {
				pstrlen: msgBuffer[0],
				pstr: msgBuffer.slice(1, msgBuffer[0] + 1),
				reserved: msgBuffer.slice(msgBuffer[0] + 1, msgBuffer[0] + 9),
				infoHash: msgBuffer.slice(msgBuffer[0] + 9, msgBuffer[0] + 29),
				peerId: msgBuffer.slice(msgBuffer[0] + 29, msgBuffer[0] + 49)
			}
		} catch (err) {
			logger.warn('Error on handshake received from : ' + this.remoteClientHref + '(', err, ')');
			this.client.destroy();
			return ;
		}

		// can make a list of accepted peerId
		if (Buffer.byteLength(msgBuffer) != 68 || this.bt.metadata.infoHashBuffer.compare(handshake.infoHash) != 0) {
			logger.debug('Error on handshake received from : ' + this.remoteClientHref +
				' wrong length or infoHash');
			this.client.destroy();
		}
		logger.debug('Receive handshake from ' + this.remoteClientHref);
	},
	Peer.prototype.bitfield = function(msgBuffer, msgLen) {
		var msgBufferLen = Buffer.byteLength(msgBuffer);

		if (msgLen != Buffer.byteLength(msgBuffer)) {
			logger.debug('Error from ' + this.remoteClientHref + ' : [bitfield] incorrect length');
			this.client.destroy();
		}
		var bitfieldData = msgBuffer.slice(5, msgBufferLen);
		var availableIndex = 0;

		for (var i = 0; i < Buffer.byteLength(bitfieldData); i++) {
			var bits = "00000000".substr(bitfieldData[i].toString(2).length) + bitfieldData[i].toString(2);
			for (var j = 0; j < bits.split('').length; j++) {
				if (bits.split('')[j] == 1 && this.bt.pieces.indexOf(availableIndex) >= 0)
						this.availablePieces.push(availableIndex);
				availableIndex++;
			}
		}
		if (this.availablePieces.length == this.bt.metadata.pieces.length)
			this.peerAllPieces = true; // Peer got all file pieces
		logger.debug('Send interested msg to : ' + this.remoteClientHref);
		this.client.write(this.bt.msg.INTERESTED);
	},
	Peer.prototype.have = function(msgBuffer) {
		// Have message = 9 bytes
		if (Buffer.byteLength(msgBuffer) != 9) {
			logger.debug('Error from ' + this.remoteClientHref + ' : [have]');
			this.client.destroy();
		}
		var pieceIndex = msgBuffer.readUInt32BE(5); // verify if piece index good length(9) ?

		if (this.availablePieces.indexOf(pieceIndex) == -1)
			this.availablePieces.push(pieceIndex);
		if (this.availablePieces.length == this.bt.metadata.pieces.length)
			this.peerAllPieces = true; // Peer got all file pieces
		logger.debug('Send interested msg to : ' + this.remoteClientHref);
		this.client.write(this.bt.msg.INTERESTED);
	}
}