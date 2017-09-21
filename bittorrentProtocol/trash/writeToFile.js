	Peer.prototype.writeToFiles = function() {
		for (var i = 0; i < this.bt.files.length; i++) {
			var pieceIndex = this.bt.files[i].pieces.indexOf(this.currentPiece.index);
			if (pieceIndex >= 0) {
				var filePieceOffset = this.bt.files[i].piecesOffset[pieceIndex];
				var dataToInsert = this.currentPiece.data.slice(filePieceOffset.begin, filePieceOffset.end);
				logger.debug('Data len: ' + Buffer.byteLength(dataToInsert) +' from: ' + Buffer.byteLength(this.currentPiece.data));

				// console.log(this.bt.files[i]);
				// /!!\ Need a better way for IO file writing at specific pos /!!\
				// why not make a pool and every 5 pieces link(0,1,2,3,4,5) write to file ?
				if (this.bt.files[i].piecesDl.length > 0) {
					var pieceBeforeCurrent;

					for (var j = 0; j < this.bt.files[i].piecesDl.length - 1; j++) {
						if (this.currentPiece.index < this.bt.files[i].piecesDl[j + 1]) {
							pieceBeforeCurrent = this.bt.files[i].piecesDl[j];
							break ;
						}
					}
					if (this.bt.files[i].piecesDl[0] > this.currentPiece.index) {
						logger.debug('Prepending data to ' + this.bt.files[i].name);
						var file = fs.readFileSync(this.bt.files[i].dlPath);
						var new_file = Buffer.concat([dataToInsert, file]);

						fs.writeFileSync(this.bt.files[i].dlPath, new_file);
					}
					else if (typeof pieceBeforeCurrent == 'undefined') {
						logger.debug('Appending data to ' + this.bt.files[i].name);

						fs.appendFileSync(this.bt.files[i].dlPath, dataToInsert, 'binary');
					}
					else {
						var fileOffset = 0;

						logger.debug('pieceBeforeCurrent: ' + pieceBeforeCurrent);
						for (var j = 0; j <= this.bt.files[i].piecesDl.indexOf(pieceBeforeCurrent); j++) {
							var pieceOffset = this.bt.files[i].piecesOffset[this.bt.files[i]
								.pieces.indexOf(this.bt.files[i].piecesDl[j])];
							fileOffset += (pieceOffset.end - pieceOffset.begin);
						}

						logger.debug('write data to ' + this.bt.files[i].name + ' offset: ' +
							fileOffset);
						// fd w+ not work ? 
						var file = fs.readFileSync(this.bt.files[i].dlPath);
						var begin = file.slice(0, fileOffset);
						var end = file.slice(fileOffset, Buffer.byteLength(file));
						var new_file = Buffer.concat([begin, dataToInsert, end]);

						fs.writeFileSync(this.bt.files[i].dlPath, new_file);
					}
				}
				else {
					logger.debug('1st piece of file: Appending data to ' + this.bt.files[i].name);
					var stat = fs.statSync(this.bt.files[i].dlPath);
					fs.appendFileSync(this.bt.files[i].dlPath, dataToInsert, 'binary');
				}
				// var stat = fs.statSync(this.bt.files[i].dlPath);
				// logger.debug('File len: ' + stat.size);
				this.bt.files[i].piecesDl.push(this.currentPiece.index);
				this.bt.files[i].piecesDl.sort((a, b) => a - b);

				logger.debug('pieces dl: ' + this.bt.files[i].piecesDl);

				if (this.bt.files[i].piecesDl.length == this.bt.files[i].pieces.length) {
					logger.info(this.bt.files[i].dlPath + ' finished !');
					
					if (this.bt.files.length == 1) {
						this.bt.emitter.emit('pieceExchangeFinished', this.bt.files[i].dlPath);
						// verif len
						this.client.destroy();
						logger.info('Torrent download of ' + this.bt.metadata.name + ' finished');
					}
					this.bt.files.splice(this.bt.files.indexOf(this.bt.files[i]), 1);
				}
				else if (this.bt.files[i].started == false) {
					this.bt.emitter.emit('pieceExchangeStarted', this.bt.files[i].dlPath);
					this.bt.files[i].started = true;
				}
			}
			else
				logger.error('Cannot find piece index in current files');
		}
	}