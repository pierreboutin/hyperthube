var request = require('request');
var token = {url:'http://localhost'};

//create first dev admin account if he doesn't exist and get api token each 24h (token is save in app.locals.apiToken) :
token.update = function (app, port) {
    var username = 'Hypertube',
        password = '09e394b6c8796af31ce5ccd39d10b8f557eae4c1471f0c699cf463d5682da1cc78ad0f6267d99e5df98f04467814d088c1c1394844a4e8e69b12b44730bec32f',
        email = 'hypertube@42.fr';
    request.post(token.url+':'+port+'/api/authenticate', {form: {username, password, email}}, function(err, res, data) {
        var obj = JSON.parse(data);
        //authenticate success :
        if (!err && obj.success) {
            console.log('apiToken :', obj.token);
            app.locals.apiToken = obj.token;
            setTimeout(()=>{token.update(app, port);}, (24*60*60*1000)-(60*1000));
        }
        //account doesn't exist, create him :
        else if (!err && !obj.success && obj.message == 'Account not exist.') {
            request.post(token.url+':'+port+'/api/account', {form: {username, password, email}}, function(err, res, data) {
                var obj = JSON.parse(data);
                if (!err && obj.success) {
                    token.update(app, port);
                }
                else {
                    console.log('Create admin dev account failed.', err, obj);
                }
            });
        }
        //authenticate fail, set app.locals.apiToken to null and retrying :
        else {
            console.log('apiToken failed, retrying in 5sec...', obj);
            app.locals.apiToken = null;
            setTimeout(()=>{token.update(app, port);}, (5*1000));
        }
    });
}

module.exports = token;
