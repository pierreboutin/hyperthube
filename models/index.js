var crypto = require('crypto');
var nodemailer = require('nodemailer');
var valid = require('validator');
var pwdhs = require('password-hash-and-salt');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var Promise = require('bluebird');

module.exports = {
	registerConfirm: function (req, cb) {
		var register = {};
		var errorKey = ['first_name', 'email', 'email_exist', 'last_name',
			'pseudo', 'pseudo_exist', 'password', 'password_confirmation', 'profile_pic'];
		var db = req.app.locals.db;
		var users = db.collection('users');

		errorKey.forEach(function(value) {
			register[value] = false;
		});

		Promise.all([
			users.find({"email" : req.body.email, 'oauth': { $exists: false }}).toArrayAsync(),
			users.find({"pseudo" : req.body.pseudo, 'oauth': { $exists: false }}).toArrayAsync()
		]).spread(function(userEmail, userPseudo) {
			if (userEmail.length) {
				register['email_exist'] = true;
			}
			if (userPseudo.length && !userPseudo.oauth) {
				register['pseudo_exist'] = true;
			}
		}).then(function() {
			registerCheck(register, users, db, req, cb);
		}).catch(function(err) {
			// console.error(err);
			cb();
		});
	},
	loginConfirm: function(req, cb) {
		var userIdErr = {
			"login" : false,
			"pwd" : false
		}
		var db = req.app.locals.db;
		var users = db.collection('users');

		users.find({"pseudo" : req.body.login, 'password': { $exists: true }, 'oauth': { $exists: false }}).toArrayAsync().then(function(pseudo) {
			if (!pseudo.length) {
				userIdErr.login = true;
				cb(userIdErr);
			}
			else
			{
				pwdhs(req.body.password).verifyAgainst(pseudo[0].password, function(err, verified) {
					if (err)
						cb(err);
					else if (!verified)
						userIdErr.pwd = true;
					cb(userIdErr);
				});
			}
		}).catch(function(err) {
			// console.error(err);
			cb();
		})
	},
	pwdForgotConfirm: function(req, res, cb) {
		var emailErr = {"email_exist" : false};
		var db = req.app.locals.db;
		var users = db.collection('users');

		users.find({"email" : req.body.email}).toArrayAsync().then(
			function(user) {
				if (user.length) {
					emailErr.email_exist = true;
					var token = crypto.randomBytes(64).toString('hex');
					users.updateAsync({"email" : user[0].email},
						{$set: {
							pwdRecoveryKey:token,
							pwdRecoveryKeyExpire: Date.now()
						}}
					).then(function() {
						sendMail(req, res, emailErr, user[0].pseudo, token, cb);
					});
				}
				else
					cb(emailErr);
		}).catch(function(err) {
			// console.error(err);
			cb();
		});
	},
	checkToken: function(req, res, cb) {
		var pwdErr = {"valid_pwd" : false};
		var db = req.app.locals.db;
		var users = db.collection('users');

		users.find({"pwdRecoveryKey": req.body.token}).toArrayAsync().then(
			function(user) {
			if (user.length) {
				var pwd_regex = /[A-Z0-9]+/;
				if (user[0].pwdRecoveryKeyExpire < Date.now() - 3600 && ((pwd_regex.test(req.body.new_pwd))
					&& req.body.new_pwd.length >= 5 && req.body.new_pwd.length <= 255)) {
					pwdhs(req.body.new_pwd).hash(function(err, hash) {
						if (err)
							cb(err);
						else {
							users.update({"pwdRecoveryKey":req.body.token},
						 	{$set : {"password" : hash}});
						 	users.update({"pwdRecoveryKey":req.body.token},
						 	{$unset : {"pwdRecoveryKeyExpire" : user[0].pwdRecoveryKeyExpire}});
						 	users.update({"pwdRecoveryKey":req.body.token},
						 	{$unset : {"pwdRecoveryKey" : user[0].pwdRecoveryKey}});
							pwdErr.valid_pwd = true;
							cb(pwdErr);
						}
					});
				}
				else if (user[0].pwdRecoveryKeyExpire > Date.now() - 3600)
					res.redirect('/');
				else
					cb(pwdErr);
			}
			else
				cb(pwdErr);
		}).catch(function(err) {
			// console.error(err);
			cb();
		});
	}
}


function sendMail(req, res, emailErr, pseudo, token, cb) {
	var smtpTransport = nodemailer.createTransport({
		host: 'smtp.gmail.com',
		secure: false,
		auth: {
			user: "matchaconfirm@gmail.com",
			pass: "Matchaaa"
		}
	});
	var mailOptions = {
		to: req.body.email,
		subject: 'Hypertube password forgotten',
		html: "Hello, " + pseudo + ", it seems you have forgotten your password." +
		"Please click the following link to change it.<br /><a href=\"http://" + req.headers.host + "/#tkn=" + token + "\">reset password</a>"
		+ "(link will expire in one hour.)\n<br /> If you did not request this, please ignore this email."
	}
	smtpTransport.sendMail(mailOptions, function(error, response) {
		if (error) {
			// console.error(error);
			cb();
		}
		else
			cb(emailErr);
	});
}


function registerCheck(register, users, db, req, cb)
{
	var pwd_regex = /[A-Z0-9]+/;

	if (req.body.first_name.length < 2 || req.body.first_name.length > 40
	|| /[^a-zA-Z0-9\s]/.test(req.body.first_name))
		register['first_name'] = true;
	if (req.body.last_name.length < 2 || req.body.last_name.length > 40
		|| /[^a-zA-Z0-9\s]/.test(req.body.first_name))
		register['last_name'] = true;
	if (!valid.isEmail(req.body.email))
		register['email'] = true;
	if (req.body.pseudo.length < 2 || req.body.pseudo.length > 12)
		register['pseudo'] = true;
	if ((!pwd_regex.test(req.body.password)) || req.body.password.length < 5 || req.body.password.length > 255)
		register['password'] = true;
	if ((!pwd_regex.test(req.body.password)) || req.body.password_confirmation.length < 5 || req.body.password_confirmation.length > 255
		|| req.body.password != req.body.password_confirmation)
		register['password_confirmation'] = true;
	if (typeof req.body.profile_pic === 'undefined')
		register['profile_pic'] = true;

	// register.every((elem) => return false);
	if (!/true/.test(JSON.stringify(register)))
	{
		pwdhs(req.body.password).hash(function(err, hash) {
			if (err)
			{
				// console.error(err);
				cb();
			}
			else
			{
				users.insertAsync({
					'first_name' : req.body.first_name,
					'last_name' : req.body.last_name,
					'email' : req.body.email,
					'pseudo': req.body.pseudo,
					'password' : hash
				}).then(function(){
					profile_pic_add(req, cb, register);
				}).catch(function(err) {
					// console.error(err);
					cb();
				});
			}
		});
	}
	else
		cb(register);
}

function profile_pic_add(req, cb, register) {
	mkdirp(path.normalize('./views/myProfile/profile_pictures/' + req.body.pseudo), function(err) {
		if (err)
			cb(err);
		else {
			if (/^data:image\/(png|jpg|jpeg);base64/.test(req.body.profile_pic)) {
				var picType = req.body.profile_pic.match(/^data:image\/(png|jpg|jpeg);base64,/);
				var base64Data = req.body.profile_pic.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
				var imgName = Date.now() + req.body.pseudo + require('crypto').randomBytes(64).toString('hex');
				var profile_picture_path ='/myProfile/profile_pictures/' + req.body.pseudo +
					'/' + imgName + '.' + picType[1];

				fs.writeFileAsync(path.normalize('./views' + profile_picture_path), base64Data, 'base64').then(
					function() {
				    var collection = req.app.locals.db.collection("users");

					return collection.updateAsync({"pseudo":req.body.pseudo}, {
						$set : {"profile_picture_path" : profile_picture_path}
					});
				}).then(function() {
					register.profile_picture_path = profile_picture_path;
					cb(register);
				}).catch(function(err) {
					// console.error(err);
					cb(register);
				});
			}
			else
				cb(register);
		}
	});
}