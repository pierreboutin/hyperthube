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
		this.files[i].piecesDl = [];
		this.files[i].piecesOffset = [];

		for (var j = fileFirstPiece; j < fileLastPiece; j += pieceLength) {
			var piece = j / pieceLength;
			this.files[i].pieces.push(piece);
		}
		if (this.files[i].pieces.length == 1) {
			var begin = this.files[i].offset - (this.files[i].pieces[0] * pieceLength);
			var end = begin + this.files[i].length;

			this.files[i].piecesOffset.push({
				begin: begin,
				end: end
			});
		}
		else if (this.files[i].pieces.length == 2) {
			var firstBegin = this.files[i].offset - (this.files[i].pieces[0] * pieceLength);
			var secondEnd = (this.files[i].offset + this.files[i].length) -
				(this.files[i].pieces[1] * pieceLength);

			this.files[i].piecesOffset.push({
				begin: firstBegin,
				end: pieceLength
			},{
				begin: 0,
				end: secondEnd
			});
		}
		else if (this.files[i].pieces.length > 2) {
			var firstBegin = this.files[i].offset - (this.files[i].pieces[0] * pieceLength);
			var lastBegin = this.files[i].pieces[this.files[i].pieces.length - 1] * pieceLength;
			var lastEnd = (this.files[i].offset + this.files[i].length) -
				this.files[i].pieces[this.files[i].pieces.length - 1] * pieceLength;

			this.files[i].piecesOffset.push({
				begin: firstBegin,
				end: pieceLength
			});
			for (var j = this.files[i].pieces[1] * pieceLength; j < lastBegin; j += pieceLength) {
				this.files[i].piecesOffset.push({
					begin: 0,
					end: pieceLength
				});
			}
			this.files[i].piecesOffset.push({
				begin: 0,
				end: lastEnd
			});
		}
		// console.log(this.files[i]);
	}
}