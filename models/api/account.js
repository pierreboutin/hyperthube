var pwdhs = require('password-hash-and-salt');
var valid = require('validator');
var apiUsers = {};

apiUsers.new = function(req, user, callback) {
    var db = req.app.locals.db;
    var users = db.collection('api');

    users.find({$or: [{username: user.username},{email: user.email}]}).toArray(function(err, docs) {
        //console.log(err, docs);
        if (!err && docs.length == 0) {
            if (user.username && user.username.length >= 5 &&
                user.password && user.password.length >= 5 &&
                user.email && valid.isEmail(user.email)) {
                //the first api admin :
                user.admin = (user.email == 'hypertube@42.fr') ? true : false;
                pwdhs(user.password).hash(function(err, hash) {
                    if (!err) {
                        user.password = hash;
                        users.insertOne(user, function(err, r) {
                            if (!err) {
                                //console.log(err, r);
                                callback({success: true, message: 'Account created.'});
                            }
                            else
                                callback({success: false, message: 'Error in insert.', error: err});
                        });
                    }
                    else
                        callback({success: false, message: 'Error in hash password.', error: err});
                });
            }
            else
                callback({success: false, message: 'Bad information.',
                    username: (user.username && user.username.length >= 5),
                    password: (user.password && user.password.length >= 5),
                    email: (user.email && valid.isEmail(user.email))
                });
        }
        else if (docs.length)
            callback({success: false, message: 'Account already exist.'});
        else
            callback({success: false, message: 'Error in find.', error: err});
    });
}

apiUsers.check = function(req, user, callback) {
    var db = req.app.locals.db;
    var users = db.collection('api');

    users.findOne({username: user.username, email: user.email}, {}, function(err, doc) {
        if (!err && doc) {
            pwdhs(user.password).verifyAgainst(doc.password, function(err, verified) {
                //console.log(err, verified);
                if (!err && verified)
                    callback({success: true, message: 'Account check.', admin: doc.admin});
                else if (!verified)
                    callback({success: false, message: 'Bad password.'});
            });
        }
        else if (!err && !doc)
            callback({success: false, message: 'Account not exist.'});
        else
            callback({success: false, message: 'Error in find.', error: err});
    });
}

apiUsers.delete = function(req, user, callback) {
    var db = req.app.locals.db;
    var users = db.collection('api');

    if (user.token.admin) {
        users.deleteOne({username: user.username, email: user.email}, {}, function(err, doc) {
            if (!err && doc) {
                callback({success: true, message: 'Account delete.'});
            }
            else if (!err && !doc)
                callback({success: false, message: 'Account not exist.'});
            else
                callback({success: false, message: 'Error in find.', error: err});
        });
    }
    else {
        if (user.token.username == user.username && user.token.email == user.email) {
            apiUsers.check(req, {username: user.username, email: user.email, password: user.password}, (err)=>{
                if (err.success) {
                    users.deleteOne({username: user.username, email: user.email}, {}, function(err, doc) {
                        if (!err && doc) {
                            callback({success: true, message: 'Account delete.'});
                        }
                        else if (!err && !doc)
                            callback({success: false, message: 'Account not exist.'});
                        else
                            callback({success: false, message: 'Error in find.', error: err});
                    });
                }
                else
                    callback(err);
            });
        }
        else {
            callback({success: false, message: 'You need admin right.'});
        }
    }
}

module.exports = apiUsers;
