$('header').load('/generic/html/header.html', function() {

  window.console.log = function() {};
  window.console.groupCollapsed = function() {};
  window.console.error = function () {};

  (function($){
	$.fn.translate = function(options) {

		var that = this; //a reference to ourselves

		var settings = {
			css: "trn",
			lang: "en"

		};
		settings = $.extend(settings, options || {});
		if (settings.css.lastIndexOf(".", 0) !== 0)   //doesn't start with '.'
			settings.css = "." + settings.css;

		var t = settings.t;

		//public methods
		this.lang = function(l) {
			if (l) {
				settings.lang = l;
				this.translate(settings);  //translate everything
			}

			return settings.lang;
		};
		this.get = function(index) {
			var res = index;

			try {
				res = t[index][settings.lang];
			}
			catch (err) {
				//not found, return index
				return index;
			}

			if (res)
				return res;
			else
				return index;
		};
		this.g = this.get;
		//main
		this.find(settings.css).each(function(i) {
			var $this = $(this);

			var trn_key = $this.attr("data-trn-key");
			if (!trn_key) {
				trn_key = $this.html();
				$this.attr("data-trn-key", trn_key);   //store key for next time
			}

			$this.html(that.get(trn_key));
		});
		return this;
	};
	})(jQuery);
  var dict = {
	  "title": {
	    fr: "titre",
			en: "title"
	  },
	  "runtime": {
	    fr: "durée",
	    en: "runtime"
	  },
		"writer": {
	    fr: "auteur",
	    en: "writer"
	  },
    "actors": {
      fr: "acteurs",
      en: "actors"
    },
    "productor": {
      fr: "producteur",
      en: "productor"
    },
		"director": {
	    fr: "réalisateur",
	    en: "director"
	  },
		"subjects": {
	    fr: "genres",
	    en: "subjects"
	  },
		"files": {
	    fr: "fichiers",
	    en: "files"
	  },
		"Last name": {
	    fr: "nom",
	    en: "Last name"
	  },
    "My profile": {
	    fr: "Mon profil",
			en: "My profile"
	  },
		"All profiles": {
	    fr: "tous les profiles",
	    en: "All profiles"
	  },	"Logout": {
  	    fr: "se deconnecter",
  	    en: "Logout"
  	  },
  		"average rating": {
  	    fr: "note moyenne",
  	    en: "average rating"
  	  }
	}
  $("#language-fr").click(function() {
		//console.log("tata")
		var translator = $('body').translate({lang: "en", t: dict}); //use English
		translator.lang("fr");
		$("#language").attr('src',"/img/flag-fr.png");
		$("#language-frA").attr('class',"active");
		$("#language-enA").removeClass("active");
		var tab2 = $(".red-tooltip");
		if(tab2[0])
			tab2[0].setAttribute("placeholder", "Prénom");
		if(tab2[1])
			tab2[1].setAttribute("placeholder", "Nom");
		if(tab2[4])
			tab2[4].setAttribute("placeholder", "Faites une courte présentation de vous-même");
		if($("#title"))
			$("#title").attr("placeholder", "Rechercher des extraits");
		if($("#from"))
			$("#from").attr("placeholder", "de");
		if($("#to"))
			$("#to").attr("placeholder", "à");

		$.ajax({
			url: '/home/language',
			type: 'POST',
			data: {language: "fr"},
			success: function(user) {
				//console.log("language is set");
				//console.log(user);

			}

		});

	});
	$("#language-en").click(function() {
		//console.log("tati")
		var translator = $('body').translate({lang: "fr", t: dict}); //use English
		translator.lang("en");
		$("#language").attr('src',"/img/flag-gb.png");
		$("#language-enA").attr('class',"active");
		$("#language-frA").removeClass("active");
		var tab2 = $(".red-tooltip");
		if(tab2[0])
			tab2[0].setAttribute("placeholder", "First name");
		if(tab2[1])
			tab2[1].setAttribute("placeholder", "Last name");
		if(tab2[4])
			tab2[4].setAttribute("placeholder", "Make a short presentation of yourself..");
		if($("#title"))
			$("#title").attr("placeholder", "Search for snippets");
		if($("#from"))
			$("#from").attr("placeholder", "from");
		if($("#to"))
			$("#to").attr("placeholder", "to");
		$.ajax({
			url: '/home/language',
			type: 'POST',
			data: {language: "en"},
			success: function(user) {
				//console.log("language is set");
				//console.log(user);

			}

		});
	});
  (function (){
		$.ajax({
			url: '/home/language',
			type: 'POST',
			success: function(user) {
			if(user == "fr")
			{
				(function() {
					//console.log("tata")
					var translator = $('body').translate({lang: "en", t: dict}); //use English
					translator.lang("fr");
					$("#language").attr('src',"/img/flag-fr.png");
					$("#language-frA").attr('class',"active");
					$("#language-enA").removeClass("active");
					var tab2 = $(".red-tooltip");
					if(tab2[0])
						tab2[0].setAttribute("placeholder", "Prénom");
					if(tab2[1])
						tab2[1].setAttribute("placeholder", "Nom");
					if(tab2[4])
						tab2[4].setAttribute("placeholder", "Faites une courte présentation de vous-même");
					if($("#title"))
						$("#title").attr("placeholder", "Rechercher des extraits");
					if($("#from"))
						$("#from").attr("placeholder", "de");
					if($("#to"))
						$("#to").attr("placeholder", "à");
					$.ajax({
						url: '/home/language',
						type: 'POST',
						data: {language: "fr"},
						success: function(user) {
							//console.log("language is set");
							//console.log(user);

						}

					});

				})();

			}
			else if(user == "en")
			{
			(function() {
					//console.log("tati")
					var translator = $('body').translate({lang: "fr", t: dict}); //use English
					translator.lang("en");
					$("#language").attr('src',"/img/flag-gb.png");
					$("#language-enA").attr('class',"active");
					$("#language-frA").removeClass("active");
					var tab2 = $(".red-tooltip");
					if(tab2[0])
						tab2[0].setAttribute("placeholder", "First name");
					if(tab2[1])
						tab2[1].setAttribute("placeholder", "Last name");
					if(tab2[4])
						tab2[4].setAttribute("placeholder", "Make a short presentation of yourself..");
					if($("#title"))
						$("#title").attr("placeholder", "Search for snippets");
					if($("#from"))
						$("#from").attr("placeholder", "from");
					if($("#to"))
						$("#to").attr("placeholder", "to");
					$.ajax({
						url: '/home/language',
						type: 'POST',
						data: {language: "en"},
						success: function(user) {
							//console.log("language is set");
							//console.log(user);

						}

					});
				})();
			}


			}

		});

	})();

    var video = {};
    var video_setup = { 'controls': true,
                        'preload': 'none',
                        'playbackRates': [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 3],
                        'techOrder': [ 'html5', /*'flash'*/ ]
                        // 'plugins': {
                        //     videoJsResolutionSwitcher: {
                        //         default: 'low',
                        //         dynamicLabel: true
                        //     }
                        // }
                      }
    videojs.log.level('off');
    video.player = videojs('video', video_setup);

    // -------- MOVIE INFO TABLE ---------- //
    function findGetParameter(parameterName) {
        var result = "",
            tmp = [];
        if (!location.search)
          return "";
        location.search
        .substr(1)
            .split("&")
            .forEach(function (item) {
        //    console.log("QUERY :" + decodeURIComponent(item));
            tmp = item.split("=");
            if (decodeURIComponent(tmp[0]) === parameterName) result = decodeURIComponent(tmp[1]);
        });
        return result;
    }
    function isJson(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
      }
var q_movie = findGetParameter("movie");
var movie;
if (isJson(q_movie))
  movie = JSON.parse(q_movie);

if (movie)
{

  $('#avg_rating').append(movie.avg_rating);
  if(movie.date)
    $('#date').append((movie.date.split("T"))[0]);
  $('#title').append(movie.title);
  $('#subject').append(movie.subject);
  if (movie.director)
    $('#director').append(movie.director);
  else if (movie.creator)
    $('#director').append(movie.creator);
  var production_co = movie.production;
  $('#producer').append(movie.publisher ? movie.publisher : movie.production);
  $('#writer').append(movie.writer);
  $('#actors').append(movie.actors);
  $('#description').append(movie.description);
  $('#runtime').append(movie.runtime);
	console.log("MOVIE : ", movie);


  // -------- SUBTITLES  ----------- //
  if (movie.title) {
    $.ajax({
      url : '/api/subtitles',
      type: 'GET',
      data: {title: movie.title},
      //data: {imdbld: 'tt1156398'},
      success : function(data) {
        if (data.success) {
            data.subtitles.forEach(function (elem) {
              // console.log('NEW TRACK ', elem);
              // $("#video_html5_api").append(
              //   $("<track label='" + elem.lang + "' kind='subtitles' srclang='" + elem.langShort + "' src='/subtitles/" + elem.fileName + "'>")
              // );
              try {
                  if (elem.fileName.length > 0) {
                      video.player.addRemoteTextTrack({ src: '/subtitles/' + elem.fileName, kind: 'caption', language: elem.langShort, label: elem.lang }, true);
                  }
              } catch (e) {
               console.log("VIDEO ERROR", e);
              }

            });
          }
      }
    });
  }
  // ======================== //

}
// var imdb_rating = findGetParameter("avg_rating").replace(/\+/g, ' ');
// var date = findGetParameter("date").replace(/\+/g, ' ');
// var title = findGetParameter("title").replace(/\+/g, ' ');
// var subject = findGetParameter("subject").replace(/\+/g, ' ');
// //console.log("PARAM|" + imdb_rating +"|PARAM");
// $('#avg_rating').append(imdb_rating);
// if(date)
// {
//   $('#date').append((date.split("T"))[0]);
// }
// $('#title').append(title);
// $('#subject').append(subject);
//
// $('#director').append(findGetParameter("director").replace(/\+/g, ' '));
// $('#writer').append(findGetParameter("writer").replace(/\+/g, ' '));
// $('#description').append(findGetParameter("description").replace(/\+/g, ' '));
// $('#runtime').append(findGetParameter("runtime").replace(/\+/g, ' '));
// =============================//
function htmlEscape(text) {
   return text.replace(/&/g, '&amp;').
     replace(/</g, '&lt;').  // it's not neccessary to escape >
     replace(/>/g, '&gt;').
     replace(/"/g, '&quot;').
     replace(/'/g, '&#039;');
}

$( "#share" ).click(function() {
  if(movie && movie.title)
  {
  var commentary = $('#commentary').val();
//  console.log(commentary);
  commentary = htmlEscape(commentary);
  $.ajax({
    url: '/commentary',
    type: 'POST',
    data: {commentary: commentary,
            film: movie.title},
    success : function(data) {
      //  $('#commentary').val("");
      //  alert( "Handler for .click() called." );
        $("div.ti").remove();
        comment();

  //    $('#comment').append('<div class="panel-body" id="panel-body"><form class=""><button class="btn btn-primary pull-left" id="shares" type="button">'++'</button></form></div>');
    }
  })
}
});

 function comment()
{
$.ajax({
  url: '/commentary/get',
  type: 'POST',
  data: {film: movie.title},
  success : function(data) {
    //  console.log(data);
      if(data.length != 0)
      {
        var res = data[0].commentary.split("/***/");
    //    console.log(res);
        for(var i in res)
        {
      //    [{username: "pboutin", comment: "toto"}, {username: "pboutin", comment: "toto"}]
          if((parseInt(i)+1) != res.length)
          {
          if(parseInt(i) % 2 == 0)
          {
  //          console.log(i);
          $('#comment').append('<div class="panel-body ti" id="panel-body"><form class=""><button class="btn btn-primary pull-left" id="shares" type="button">'+res[parseInt(i)]+'</button></form></div>');
          }
          else {
            $('#comment').append('<div class="panel-body2 ti"><p id="commentary" class="pb-cmnt-textarea">'+res[parseInt(i)]+'</p></div>')

          }
        }
        }
      }

  }
})
}

 if(movie && movie.title)
 {
  comment();
 }




    var hash = location.pathname.replace(/\/stream\/([a-zA-Z0-9]+).*/, '$1');

    $.getJSON('/torrent/files/'+hash, function(data) {
    //    console.log(data);
        $('#listFiles ul').empty();
        for (var i = 0; data.files && i < data.files.length; i++) {
            var li = $('<li></li>');
            var link = '/stream/'+hash+'/'+encodeURIComponent(data.files[i].name);
            li.append('<a href="'+link+'">'+data.files[i].name+'</a>');
            li.find('a').click(function(e) {
                e.preventDefault();
                var li = $(this).parent();
                //console.log('click');
                if ($(this).attr('refresh')) {
                    $(this).removeAttr('refresh');
                    if (li.find('p').length > 0) {
                        p = li.find('p');
                        p.slideUp();
                    }
                }
                else {
                    $(this).attr('refresh', true);
                    var p = $('<p></p>');
                    if (li.find('p').length > 0) {
                        p = li.find('p');
                        p.empty();
                    }
                    else {
                        li.append(p);
                    }
                    var percent = 0, txt = 'loading...';
                    p.append('<button disabled class="btn btn-info btn-loading"><span class="btn-loading-load" style="width:'+percent+'%;"><span class="btn-loading-text">'+txt+'</span></span></button><br>');
                    p.hide().slideDown();
                }
            })
            $('#listFiles ul').append(li);
        }
        if (data.files.length == 0) {
            var li = $('<li></li>');
            li.append('<p>No video found in this torrent.</p>');
            $('#listFiles ul').append(li);
        }
    });

    //var video = {};
    //video.player = videojs('video');
    video.player.on('timeupdate', (e)=>{
        //console.log('timeupdate lastTime:', video.player.currentTime());
        video.lastTime = video.player.currentTime();
    });
    video.player.on('seeking', (e)=>{
        //console.log('seeking', video.player.currentTime());
        if (video.player.currentTime() == 0 && video.lastTime > 0) {
            //console.log('reload', video.player.duration(), video.lastTime);
            video.player.src({type: 'video/webm', src: video.player.src()+Math.round(Math.random())});
            video.player.play();
            var goto = video.lastTime-0.5;
            goto = goto > 0 ? goto : 0;
      //      console.log('set to', goto);
            setTimeout((val)=>{
                video.player.currentTime(goto);
            },500);
        }
    });
    video.player.on('ended', ()=>{
        if (video.percent == 100 && parseInt(video.player.currentTime()) == parseInt(video.duration)) {
            return;
        }
        video.lastTime = video.player.currentTime() > video.player.duration() ? video.player.duration() : video.player.currentTime();
  //      console.log('ended', video.lastTime, video.player.duration());
        video.player.src({type: 'video/webm', src: video.player.src()+Math.round(Math.random())});
        video.player.play();
        if (video.player.duration() >= video.lastTime) {
            var goto = video.lastTime-0.5;
            goto = goto > 0 ? goto : 0;
  //          console.log('set to', goto);
            setTimeout((val)=>{
                video.player.currentTime(goto);
            },500);
        }
    });

    var stop = false, max = 0;
    setInterval(()=>{
        if (window.stopInter || stop) {
            return;
        }
        ////console.log($('#listFiles ul li a[refresh]').length);
        max = $('#listFiles ul li a[refresh]').length;
        var finished = 0;
        $('#listFiles ul li a[refresh]').each(function(index, elem) {
            var ln = $(elem).attr('href'), li = $(elem).parent();
            stop = true;
            $.getJSON(ln, function(data) {
                ////console.log(data, ln);
                var p = $('<p></p>');
                if (li.find('p').length > 0) {
                    p = li.find('p');
                    p.empty();
                }
                var percent = 0, txt = 'loading...';
                if (data.percent) {
                    txt = 'file '+data.percent+'% downloaded';
                    percent = data.percent;
                }
                p.append('<button disabled class="btn btn-info btn-loading"><span class="btn-loading-load" style="width:'+percent+'%;"><span class="btn-loading-text">'+txt+'</span></span></button><br>');
                if (data.success) {
                    video.percent = data.percent;
                    video.duration = data.duration;
                    for (let i = 0; i < data.choices.length; i++) {
                        var percent = (data.choices[i].percent ? data.choices[i].percent : 0);
                        p.append('<button href="'+ln+'/webm?res='+data.choices[i].res+'&fps='+data.choices[i].fps+'" class="btn btn-info btn-loading"><span class="btn-loading-load" style="width:'+percent+'%;"><span class="btn-loading-text">'+data.choices[i].res+'p '+data.choices[i].fps+'fps ('+percent+'%)</span></span></button>');
                        //p.append('<a href="'+link+'/webm?res='+data.choices[i].res+'&fps='+data.choices[i].fps+'">'+data.choices[i].res+'p '+data.choices[i].fps+'fps ('+(data.choices[i].percent ? data.choices[i].percent : 0)+'% converted)</a>');
                        ////console.log(data.choices[i].secStreamable - 30);
                        if (ln == video.file && video.res == data.choices[i].res && video.fps == data.choices[i].fps) {
                            video.player.duration(data.choices[i].secStreamable);
                        }
                        let index = p.find('button').length - 1;
                        $(p.find('button')[index]).click((e) => {
                            e.preventDefault();
                            var href = $(p.find('button')[index]).attr('href');
                            video.file = ln;
                            video.res = data.choices[i].res;
                            video.fps = data.choices[i].fps;
                            video.loading = href;
                            var loading = ()=>{
                                $.getJSON(href.replace(/\/webm\?/, '/ready?'), function(ready) {
                                    if (!ready.playable) {
                                        if (video.loading == href)
                                            setTimeout(()=>{loading();}, 1000);
                                        else
                                            return;
                                    }
                                    else {
                                        //console.log('dur:');
                                        video.lastTime = video.player.currentTime();
                                        video.player.src({type: 'video/webm', src: href+'&'+new Date().getTime()});
                                        video.player.play();
                                        if (video.player.duration() > video.lastTime) {
                                        //    console.log('set to', video.lastTime);
                                            setTimeout((val)=>{
                                                video.player.currentTime(video.lastTime);
                                            },500);
                                        }
                                    }
                                    //console.log(ready, ready.wait);
                                    if (ready.wait) {
                                        $('#waitStart').slideDown();
                                        $('#waitStart').text('Video start in '+ready.wait.min+' min '+ready.wait.sec+' sec');
                                    }
                                    else {
                                        $('#waitStart').slideUp();
                                    }
                                });
                            }
                            loading();
                            //console.log(video);
                            //$('#video').attr('src', $(this).attr('href'));
                        });
                    }
                }
                li.append(p);
            }).always(function() {
                finished++;
                //console.log(finished, max);
                if (finished == max) {
                    stop = false;
                }
            });
        });
    }, 1000);

    $('#url').submit(function(e) {
        e.preventDefault();
        $.getJSON('/torrent/download/'+encodeURIComponent($('#url input[type=text]').val()), function(data) {
            //console.log(data);
            if(data.success) {
                location.href = data.redirect;
            }
            else {
                //console.log(data.message);
            }
        });
    });
});
