var path = require('path');
var logger = require('./log.js'); 
var router = require('express').Router();
var Bittorrent = require('./Bittorrent/bittorrent.js');

router.get('/', function(req, res) {
	// octavia-m_201701_archive.torrent
	// debian-8.7.1-amd64-CD-1.iso.torrent
	// ubuntu-17.04-desktop-amd64.iso.torrent
	// TheInternetsOwnBoyTheStoryOfAaronSwartz_archive.torrent
	// var torrentPath = path.resolve('./bittorrentProtocol/torrent/files/webseedTest.torrent');
	// var torrentPath = path.resolve('./bittorrentProtocol/torrent/files/TheInternetsOwnBoyTheStoryOfAaronSwartz_archive.torrent');
	// var torrentPath = path.resolve('./bittorrentProtocol/torrent/files/octavia-m_201701_archive.torrent');
	// var torrentPath = path.resolve('./bittorrentProtocol/torrent/files/metropolis.torrent');
	// var torrentPath = path.resolve('./bittorrentProtocol/torrent/files/nasaPictures.torrent');
	var torrentPath = path.resolve('./bittorrentProtocol/torrent/files/ubuntu-17.04-desktop-amd64.iso.torrent');
	// var torrentPath = path.resolve('./bittorrentProtocol/torrent/files/Phantom_of_the_opera.torrent');
	// var mdFilePath = ['80 Amazing NASA Pictures Wallpapers [1920 X 1200] HQ - {RedDragon}/80 NASA Pictures Wallpapers 1920 X 1200/42.jpg'];
	// var ubuntuMdPath = ['ubuntu-17.04-desktop-amd64.iso'];
	// var mdPath = ['electricsheep-flock-247-7500-0/00247=09690=09690=09690.mp4'];

	var bittorrent = new Bittorrent(torrentPath);

	bittorrent.init();

	bittorrent.started(function(fileInfo) {
		// console.log('started: ', fileInfo);
		/*
		setInterval(function() {
			bittorrent.currentLen(ubuntuMdPath, function(currentLen) {
				console.log('currentLen: ' + currentLen);
			});
			bittorrent.percent(ubuntuMdPath, function(percent) {
				console.log('percent: ' + percent);
			});
		}, 15000);
		*/
	});

	bittorrent.finished(function(fileInfo) {
		// console.log('finished: ', fileInfo);
	});
	/*
	setInterval(() => {
		bittorrent.filesInfo(null, {verbose: false}, (file) => {
			console.log(file);
		});
	}, 5000);
	*/
});

module.exports = router;