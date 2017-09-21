//built-in
var path = require('path');
var fs = require('fs');
//npm
var router = require('express').Router();
//personal
var indexLib = require('../models/index.js');

require('./auth.js')(router);

router.get('/', function(req, res) {
	if (req.session && req.session.pseudo)
		res.redirect('/home');
	else
 		res.sendFile(path.resolve('./views/index/html/index.html'));
});

router.get('/home', function(req, res) {
	if (req.session && req.session.pseudo)
		res.sendFile(path.resolve('./views/home/html/home.html'));
	else
 		res.sendFile(path.resolve('./views/index/html/index.html'));
 });

router.post('/reg', function (req, res) {
	indexLib.registerConfirm(req, function(registerData) {
		if (typeof registerData === 'object')
			res.json(registerData);
		else
			res.end();
	});
});

router.post('/login', function(req, res) {
	indexLib.loginConfirm(req, function(idError) {
		if (typeof idError === 'object') {
			if (idError.login == false && idError.pwd == false)
				req.session.pseudo = req.body.login;
			res.json(idError);
		}
		else
			res.end();
	});
});

router.post('/pwd_forgot', function(req, res) {
	indexLib.pwdForgotConfirm(req, res, function(data) {
		if (typeof data === 'object')
			res.json(data);
		else
			res.end();
	});
});

router.post('/pwd_reset', function(req, res) {
	indexLib.checkToken(req, res, function(data) {
		//console.log(data);
		if (typeof data === 'object')
			res.json(data);
		else
			res.end();
	});
});

router.get('/htmlImport/:htmlElement', function(req, res) {
	if (req.params.htmlElement == 'registrationForm.html') {
		fs.stat(path.resolve('./views/index/html/import/registrationForm.html'), function(err, stats) {
			if (err) {
				console.error(err);
				res.end();
			}
			else
				res.sendFile(path.resolve('./views/index/html/import/registrationForm.html'));
		});
	}
	if (req.params.htmlElement == 'newPwdForm.html') {
		fs.stat(path.resolve('./views/index/html/import/newPwdForm.html'), function(err, stats) {
			if (err) {
				console.error(err);
				res.end();
			}
			else
				res.sendFile(path.resolve('./views/index/html/import/newPwdForm.html'));
		});
	}
});

router.get('/logout', function(req, res) {
	req.session.destroy();
	res.redirect('/');
});

module.exports = router;
