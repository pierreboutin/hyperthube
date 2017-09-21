var cheerioReq = require('cheerio-req');
var archive = {};

archive.get = function(search, pages, callback) {
    var tab = new Array;
    var extend;
    var extend2;
    var finish = 0;
    let movie;

    if(pages)
    {
        extend2 = "&page="+pages;
    }
    else {
        extend2 = "";
    }
    if(search)
    {
        extend = "&and[]="+search;
    }
    else {
        extend = "";
    }
    cheerioReq("https://archive.org/details/feature_films?&sort=-downloads"+extend+extend2, (err, $) => {
        //console.log($(".item-ttl").length)
        if ($(".item-ttl").length == 0)
            callback([]);
        $(".item-ttl").each(function(i, elem) {
            var data = $(this);
            var title = data.children().attr('title');
            /*imdb.getReq({ name: title }, (err, things) => {
                if (err) {
                }
                else {
                    movie = things;
                    tab[i][4] = movie.rated;

                }
            });*/
            tab[i] = new Array;
            tab[i][0] = data.children().attr('title');
            tab[i][1] = data.children().attr('href');
            tab[i][2] = data.parent().parent().find('.C3').children().html();
            tab[i][3] = data.parent().parent().find('.item-img').attr('source');
            finish++;
            if (finish == $(".item-ttl").length)
            {
                //console.log(tab.length);
                callback(tab);
            }
        });
    });
}

module.exports = archive;
