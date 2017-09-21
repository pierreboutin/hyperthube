var path = require('path');
var router = require('express').Router();
var myProfileLib = require('../models/myProfile.js');

router.get('/', function(req, res) {
	if (req.session && req.session.pseudo)
		res.sendFile(path.resolve('./views/myProfile/html/myProfile.html'));
	else
		res.redirect('/');
});
router.get('/user_info_exists', function(req, res) {
	myProfileLib.profileInfoExist(req, res, function(data) {
		if (typeof data === 'object')
			res.json(data);
		else
			res.send(data);
	});
});
router.post('/update_profile', function(req, res) {
	myProfileLib.updateProfile(req, res, function(data) {
		if (typeof data === 'object')
			res.json(data);
		else
			res.send(data);
	});
});

router.post('/file_size_check', function(req, res, next) {
	res.end();
});
router.post('/user_profile_picture_delete', function(req, res) {
	myProfileLib.profilePictureDelete(req, res);
});

module.exports = router;
