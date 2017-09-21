var path = require('path');
var fs = require('fs');
var valid = require('validator');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var Promise = require('bluebird');
var utilsLib = require('./utils');

Promise.promisifyAll(fs);
module.exports = {
	profileInfoExist: function(req, res, cb) {
		var db = req.app.locals.db;
		var users = db.collection('users');

		users.find({"pseudo":req.session.pseudo}).toArrayAsync().then(function(user) {
			if (user.length) {
				var profileInfo = {
					"first_name": utilsLib.escapeHtml(user[0].first_name),
					"last_name": utilsLib.escapeHtml(user[0].last_name),
					"email": utilsLib.escapeHtml(user[0].email),
					"birth_date": utilsLib.escapeHtml(user[0].birth_date),
					"gender": user[0].gender,
					"about_user": utilsLib.escapeHtml(user[0].bio),
					"profile_picture_path": user[0].profile_picture_path
				};
				cb(profileInfo);
			}
			else
				cb();
		}).catch(function(err) {
			console.error(err);
			cb(err);
		});
	},
	updateProfile: function(req, res, cb) {
		var profileErr = {};
		var profileErrKey = ['first_name', 'last_name', 'email', 'email_exist',
			'birth_date', 'gender', 'about_user', 'profile_picture'];
		profileErrKey.forEach(function(key) {
			profileErr[key] = false;
		});

		var db = req.app.locals.db;
		var users = db.collection('users');
		var actualUserEmail;

		Promise.all([
			users.find({"pseudo" : req.session.pseudo}).toArrayAsync(),
			users.find({"email" : req.body.email}).toArrayAsync()
		]).spread(function(pseudo, email) {
			if (pseudo.length)
				actualUserEmail = pseudo[0].email;
			if (email.length && actualUserEmail != req.body.email)
				profileErr.email_exist = true;
			checkProfileInput(req, res, cb, profileErr, pseudo[0]);
		}).catch(function(err) {
			console.error(err);
			cb()
		});
	},
	profilePictureDelete: function(req, res) {
		var db = req.app.locals.db;
		var users = db.collection('users');
		users.updateAsync({"pseudo" : req.session.pseudo},
			{$unset : {"profile_picture_path" : ""}}
		).then(function() {
			rimraf(path.normalize('./views/myProfile/profile_pictures/' + req.session.pseudo), function() {
				res.end();
			});
		}).catch(function(err) {
			console.error(err);
			res.end();
		});
	}
}

function checkProfileInput(req, res, cb, profileErr) {
	if (req.body.first_name.length < 2 || req.body.first_name.length > 40
		|| /[^a-zA-Z0-9\s]/.test(req.body.first_name))
		profileErr.first_name = true;
	if (req.body.last_name.length < 2 || req.body.last_name.length > 40
		|| /[^a-zA-Z0-9\s]/.test(req.body.last_name))
		profileErr.last_name = true;
	if (!valid.isEmail(req.body.email))
		profileErr.email = true;
	if (req.body.birth_date.length == 0 ||
		/^\d{4}[\-](0?[1-9]|1[012])[\-](0?[1-9]|[12][0-9]|3[01])$/.test(req.body.birth_date.trim()) == false ||
		utilsLib.getAge(req.body.birth_date) <= 18)
		profileErr.birth_date = true;
	if (typeof req.body.gender === 'undefined')
		profileErr.gender = true;
	if (req.body.bio.length < 15 || req.body.bio.length > 500)
		profileErr.about_user = true;
	if (typeof req.body.profile_picture === 'undefined')
		profileErr.profile_picture = true;
	if (!/true/.test(JSON.stringify(profileErr))) {
		var db = req.app.locals.db;
		var users = db.collection('users');

		return users.updateAsync(
			{"pseudo":req.session.pseudo},
			{$set : {
				"first_name": req.body.first_name,
				"last_name": req.body.last_name,
				"email": req.body.email,
				"birth_date": req.body.birth_date,
				"gender": req.body.gender,
				"bio": req.body.bio,
				"profileOK": true
			}
		}).then(function() {
			profile_pic_add(req, cb, users, profileErr);
		}).catch(function(err) {
			console.error(err);
			cb();
		});
	}
	else {
		var db = req.app.locals.db;
		var users = db.collection('users');

		users.updateAsync({"pseudo":req.session.pseudo}, {$set : {
			"profileOK" : false
		}}).then(function() {
			cb(profileErr);
		}).catch(function(err) {
			console.error(err);
			cb();
		})
	}
}

function profile_pic_add(req, cb, collection, profileErr) {
	mkdirp(path.normalize('./views/myProfile/profile_pictures/' + req.session.pseudo), function(err) {
		if (err)
			cb(err);
		else {
			if (/^data:image\/(png|jpg|jpeg);base64/.test(req.body.profile_picture)) {
				var picType = req.body.profile_picture.match(/^data:image\/(png|jpg|jpeg);base64,/);
				var base64Data = req.body.profile_picture.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
				var imgName = Date.now() + req.session.pseudo + require('crypto').randomBytes(64).toString('hex');
				var profile_picture_path ='/myProfile/profile_pictures/' + req.session.pseudo +
					'/' + imgName + '.' + picType[1];

				fs.writeFileAsync(path.normalize('./views' + profile_picture_path), base64Data, 'base64').then(
					function() {
					return collection.updateAsync({"pseudo":req.session.pseudo}, {
						$set : {"profile_picture_path" : profile_picture_path}
					});
				}).then(function() {
					profileErr.profile_picture_path = profile_picture_path
					cb(profileErr);
				}).catch(function(err) {
					console.error(err);
					cb();
				});
			}
			else
				cb(profileErr);
		}
	});
}
