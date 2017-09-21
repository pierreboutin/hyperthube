module.exports = {
	setcommentary: function(req) {
    var users = req.app.locals.db.collection('film');
		console.log("REQ film : ", req.body.film);
		var test = users.find({'film' : req.body.film}).toArrayAsync().then(function(result) {
			console.log('result: ', result);
			console.log(result.length);
			var commentary = req.session.pseudo+"/***/"+req.body.commentary+"/***/";
			if(result.length != 0)
			{

				users.update({"film" : req.body.film},
				{$set : {"commentary" : result[0].commentary+commentary}});
			}
			else {
					console.log("tiguouane2");
				  users.insertAsync({
						'film' : req.body.film,
						'commentary' : commentary
					});
			}
		}).catch(function(err) {

		});
	},
	getcommentary: function(req, cb) {
		var users = req.app.locals.db.collection('film');
		users.find({'film' : req.body.film}).toArrayAsync().then(function(result) {
			cb(result);
		});
	}
}
