module.exports = function(Bittorrent) {
	Bittorrent.prototype.encodeValue = function(str) {
		return str.replace(/.{2}/g, function(hexByte) {
			var asciiDec = parseInt(hexByte, 16);
			if (asciiDec <= 127) {
				hexByte = encodeURIComponent(String.fromCharCode(asciiDec));
			    if (hexByte[0] === '%')
			   		hexByte = hexByte.toLowerCase();
			} else
				hexByte = '%' + hexByte;
			return hexByte;
		});
	},
	Bittorrent.prototype.FifoWorker = function() {
		var appending = false;
		var fifo = [];

		var append = () => {
			if (fifo.length == 0 || appending) {
				return ;
			}
			appending = true;
			var appendFilePromise = fifo.shift();

			appendFilePromise.then(function() {
				appending = false;
				append();
			});
		}
		this.queue = (myPromise) => {
			fifo.push(myPromise);
			append();
		}
	}
}