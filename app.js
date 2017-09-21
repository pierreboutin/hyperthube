var express = require('express');
var app = express();
var path = require('path');
var bodyParser  = require('body-parser');
var session = require('express-session');
var Promise = require('bluebird');
var token = require('./models/api/token.js');
var mongodb = require('mongodb');
var mongod_url = 'mongodb://localhost:27017/hypertube';
var fs = require('fs');

var port = 8080;

var sessionMiddleware = session({
	secret: 'id',
	resave: 'true',
	saveUninitialized: 'false'
});

console.log = console.error = function () {};

app.use(express.static(path.resolve('./views')));

var arr = ['./videos', './torrent', './torrent/files', './torrent/downloaded', './torrent/converted', './public/subtitles'];
for (let i = 0; i < arr.length; i++) {
	fs.stat(arr[i], function(err, stat) {
		if (err != null) {
			console.log('create', arr[i]);
			fs.mkdirSync(path.resolve(arr[i]));
		}
	});
}

app.use('/subtitles', express.static('./public/subtitles/'));
app.use('/img', express.static('./public/img/'));

app.use(sessionMiddleware);
app.use(bodyParser.urlencoded({limit: '2mb', extended: false}));
app.use(bodyParser.json());
app.use(function(err, req, res, next) {
    if (err.type == 'entity.too.large')
    	res.send("bodySizeErr");
});
app.use('/', require('./controllers/index.js'));
app.use('/commentary', require('./controllers/commentary.js'));
app.use('/api', require('./controllers/api.js'));
app.use('/stream', require('./controllers/stream.js'));
app.use('/torrent', require('./controllers/torrent.js'));
app.use('/bittorrent', require('./bittorrentProtocol/route.js')); // test purpose
app.use('/home', require('./controllers/home.js'));
app.use('/home/myProfile', require('./controllers/myProfile.js'));
app.use('/home/allProfiles', require('./controllers/allProfiles.js'));

app.all('*', function(req, res) {
		if(req.session.pseudo)
			app.use('/home', require('./controllers/home.js'));
		else
			res.status(404).sendFile(path.resolve('./views/index/html/404.html'));
});

Promise.promisifyAll(mongodb);
mongodb.MongoClient.connectAsync(mongod_url, {promiseLibrary: Promise}).then(
	function (db) {
		app.locals.db = db;
		app.locals.port = port;
		app.locals.apiURL = 'http://localhost:' + port;
		app.listen(port, function() {
			console.log('App listening on port ' + port);
			token.update(app, port);
		});
	}
).catch(function(err) {
	console.error("Connection to mongodb failed");
});
