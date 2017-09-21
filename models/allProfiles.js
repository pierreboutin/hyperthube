module.exports = {
	getAllMembersData: function(req, res) {
		var db = req.app.locals.db;
		var users = db.collection('users');

		users.find().toArrayAsync().then(function(usersData) {
			res.json(usersData);
		}).catch(function(err) {
			console.error(err);
			res.end();
		});
	}
}