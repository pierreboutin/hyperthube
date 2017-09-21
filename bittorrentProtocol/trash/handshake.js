var logger = require('winston');

module.exports = function(Peer) {
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
		logger.verbose('Send interested msg to : ' + this.remoteClientHref);
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
		logger.verbose('Send interested msg to : ' + this.remoteClientHref);
		this.client.write(this.bt.msg.INTERESTED);
	}
}