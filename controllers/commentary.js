var path = require('path');
var router = require('express').Router();
var allProfilesLib = require('../models/commentary.js');

/*router.get('/', function(req, res) {
	if (req.session && req.session.pseudo)
		res.sendFile(path.resolve('./views/allProfiles/html/allProfiles.html'));
	else
		res.redirect('/');
});*/
router.post('/', function(req, res) {
	//console.log("données");
	//console.log(req);
	allProfilesLib.setcommentary(req);
  res.end();
});

router.post('/get', function(req, res) {
// 	console.log("testival");
// 	var domino;
// 	var p1 = new Promise(function(resolve, reject) {
// 	  domino = allProfilesLib.getcommentary(req);
// 		console.log("debug1");
// 		resolve("tester si ca arrive dans la callback(promise)")
// 	});
//
// 	p1.then(
// 		function(val) {
// 			console.log("debug2");
// 		console.log(val);
// 	//	res.json("erferf");
// 	}
// );
//console.log("test1");
	allProfilesLib.getcommentary(req, function (ret) {
		res.json(ret);
	});
});

module.exports = router;
