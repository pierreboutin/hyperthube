var path = require('path');
var router = require('express').Router();
var allProfilesLib = require('../models/allProfiles.js');

router.get('/', function(req, res) {
	if (req.session && req.session.pseudo)
		res.sendFile(path.resolve('./views/allProfiles/html/allProfiles.html'));
	else
		res.redirect('/');
});
router.get('/usersData', function(req, res) {
	allProfilesLib.getAllMembersData(req, res);
});

module.exports = router;