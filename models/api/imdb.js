var imdbId = require('imdb-id');
var imdb = {};

imdb.get = function(title, callback) {
    imdbId(title, function(err, imdb_id) {
        if (err) {
            callback({success: false, message: 'Imdb error.', error: err});
        } else {
            callback({success: true, id: imdb_id});
        }
    });

    // imdbApi.getReq({ name: title }, (err, movie) => {
    //     if (!err) {
    //         callback({success: true, info: movie});
    //     }
    //     else {
    //         callback({success: false, message: 'Imdb error.', error: err});
    //     }
    // });
}

module.exports = imdb;
