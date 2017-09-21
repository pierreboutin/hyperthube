$('header').load('/generic/html/header.html',function() {
	(function($){
	$.fn.translate = function(options) {

		var that = this; //a reference to ourselves

		var settings = {
			css: "trn",
			lang: "en"/*,
			t: {
				"translate": {
					pt: "tradução",
					br: "tradução"
				}
			}*/
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
	  "Subject Filter": {
	    fr: "filtre",
			en: "Subject Filter"
	  },
	  "Research": {
	    fr: "Recherche",
	    en: "Research"
	  },
		"All profiles": {
	    fr: "Tous les profiles",
	    en: "All profiles"
	  },
		"Log in with Github": {
	    fr: "se connecter avec Github",
	    en: "Log in with Github"
	  },
		"Logout": {
	    fr: "se deconnecter",
	    en: "Logout"
	  },
		"Not a member ? You may register !": {
	    fr: "Tu n'es pas membre ? Enregistres toi !",
	    en: "Not a member ? You may register !"
	  },
		"My profile": {
	    fr: "Mon profil",
	    en: "My profile"
	  },
		"First name": {
	    fr: "Prénom",
	    en: "First name"
	  },
		"Last name": {
	    fr: "nom",
	    en: "Last name"
	  },
		"First name": {
	    fr: "Prénom",
	    en: "First name"
	  },
		"Date of Birth": {
	    fr: "Date de naissance",
	    en: "Date of Birth"
	  },
		"First name": {
	    fr: "Prénom",
	    en: "First name"
	  },
		"Gender": {
	    fr: "Genre",
	    en: "Gender"
	  },
		"Female": {
	    fr: "Femme",
	    en: "Female"
	  },
		"Male": {
	    fr: "Homme",
	    en: "Male"
	  },
		"About me": {
	    fr: "A propos de moi",
	    en: "About me"
	  },
		"Load profile picture": {
	    fr: "charger une photo de profil",
	    en: "Load profile picture"
	  },
		"Browse": {
	    fr: "Parcourir",
	    en: "Browse"
	  },
		"Profile picture": {
	    fr: "photo de profil",
	    en: "Profile picture"
	  },
		"Update": {
	    fr: "mettre à jour",
	    en: "Update"
	  },
		"sort by": {
	    fr: "trier par",
	    en: "sort by"
	  }
	}
	$('#okay').on('click', function (event) {
	    $(this).parent().toggleClass('open');
	});
	$("#language-fr").click(function() {
		//console.log("tata")
		var translator = $('body').translate({lang: "en", t: dict}); //use English
		translator.lang("fr");
		$("#language").attr('src',"/img/flag-fr.png");
		$("#language-frA").attr('class',"active");
		$("#language-enA").removeClass("active");
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


});

var g_page = 1;
var g_movies = [];
var g_search = {
  sort: 4, // Most downloaded
  isArchiveProvider: true
};

$(function () {

  var $window = $(window);
  $window.scroll(function () {

    if ($window.height()  + $window.scrollTop()
    == $(document).height()) {

      g_page++;
      if (g_search.isArchiveProvider) {
        scrapArchiveOrg(g_search, function (movies) {
          //console.log("Callback scrapArchiveOrg");
          sortAndDisplayArchive(movies, g_search);
        });
      } else {
        scrapLegitTorrents(g_search, function(movies){
          g_movies = g_movies.concat(movies);
          //console.log("LEGITTORRENT : NUMBER OF MOVIES TO DISPLAY : " + g_movies.length);
          sortAndDisplayLegitT(g_movies, g_search);
        });
      }
    }
  });
});

$('#from').datepicker({
  format: "yyyy",
  autoclose: true,
  minViewMode: "years"
})    .on('changeDate', function(selected){
  startDate =  $("#from").val();
  $('#to').datepicker('setStartDate', startDate);
});
;


$('#to').datepicker({
  format: "yyyy",
  autoclose: true,
  minViewMode: "years"
});


function loadStreamPage (url, movie) {
	//console.log("LOAD STREAM PAGE : " + url);
	//console.log("tokapi");
	$.ajax({
		method  : "GET",
		url     : url,
		error    : function(request, error) {
			//console.log("ERROR : " + error + " RESP : " + request.responseText);
		},
		success  : function(resp) {
			if (resp.success) {
				//movie.title2 = encodeURI(movie);
				var redirect_uri = resp.redirect + '?movie=' + encodeURIComponent(JSON.stringify(movie));
				//console.log(resp);
				//console.log("---  REDIRECT URI : ", resp.redirect);
				window.location.href = redirect_uri;
			}
			else {
				alert("BITTORRENT PROTOCOL ERROR : \n" + resp.message);
			}
		}
	});
}

function sortAndDisplayArchive(movies, search) {
  $.ajax({
    method  : "GET",
    url     : "/home/movie_already_seen",
    error    : function(request, error) {
      //console.log("ERROR : " + error + " RESP : " + request.responseText);
    },
    success  : function(data) {
      var movie_list = data;

			if(movies.length == 0)
			{
				var sorry = $("#sorry");

				if(sorry.length == 0)
				{
					$("#movies").after("<h3 id='sorry' align='center'>Sorry, no matching results</h1>");
				}
			}
			// else {
			// 	$("#sorry").remove();
			// }
      movies.forEach(function (movie, index) {
        var display = 1;
        var date = "";

        if (movie.date)
          date = movie.date.substring(0, 4);


        if (search.subject && search.subject != "") {
          display = (movie.subject && movie.subject.indexOf(search.subject) != -1) ? display : 0;
        }

        if (search.from && search.from != "") {
          display = (movie.date && movie.date.substring(0, 4) >= search.from) ? display : 0;
        }
        if (search.to && search.to != "") {
          display = (movie.date && movie.date.substring(0, 4) <= search.to) ? display : 0;
        }

        if (search.note1 && search.note1 != "") {
          display = (movie.avg_rating
                      && (parseFloat(movie.avg_rating) * 2 >= parseFloat(search.note1))) ? display : 0;
        }
        if (search.note2 && search.note2 != "") {
          display = (movie.avg_rating
                      && (parseFloat(movie.avg_rating) * 2 <= parseFloat(search.note2))) ? display : 0;
        }
        if(!movie.date)
          display = 0;


        if (display) {
				//	console.log('https://archive.org/download/' + movie.identifier+'/'+movie.identifier+'_archive.torrent');
					var movie_box = document.createElement('div');
					movie_box.className = "movie_container  col-lg-3 col-sm-4 col-xs-6";
					movie_box.onclick = function() {
						var url = '/torrent/download/' +
								encodeURIComponent('https://archive.org/download/' + movie.identifier+'/'+movie.identifier+'_archive.torrent');
						register(movie.identifier);
						loadStreamPage(url, movie);
					};
					movie_box.innerHTML =
					'<div class="movie_box">' +
						'<p class="movie_title">'
							+ (((movie_list.match(movie.identifier) || []).length > 0) ? '<img style="width: 30px;" src="/img/pc5o5B8oi.png">' : '')
							+ movie.title + '</p>' +
						'<div style="margin-right: 18px; margin-left: 18px;">' +
								'<img class="movie_img img-rounded img-responsive" src="https://archive.org/services/img/' +
								movie.identifier + '" alt="" title="" width=400 length=300 />' +
						'</div>' + '<p style="margin-top: 12px; margin-bottom: 0px; font-weight: bold;">IMDB Rating: ' +
						 				(movie.avg_rating * 2) + ' Year: '+ date + '</p>' +
					'</div>';
					document.getElementById('movies').appendChild(movie_box);
        }
      });
	//console.log(data);
    }
  });


}

function register(identifier){
  $.ajax({
    method  : "get",
    url     : "/home/addviewmovie",
    data    : { identifier : identifier},
      error    : function(request, error) {
        //console.log("Search error : " + request.responseText);
      },
      success  : function(data) {
        //console.log("movie add");

      }
    });



}

function scrapArchiveOrg (search, cb) {

  //console.log("Archive search");
	//console.log("dimitri");
	//console.log(search);
  $.ajax({
    method  : "get",
    url     : "/home/archiveorg",
    data    : {search : search,
               page   : g_page},
      error    : function(request, error) {
        //console.log("Search error : " + request.responseText);
      },
      success  : function(data) {
        var a   = JSON.parse(data);
        // var row = $("<div class=\"row row-eq-height movie_row\"></div>");

        base_url = a.url;

        //console.log("NUMBER OF MOVIES TO SORT : " + a.response.docs.length);
        // var disp_nb = 0;
        // var last_row_index = 0;
        cb(a.response.docs);
      //   if (disp_nb - last_row_index > 0)
      //     $("#movies").append(row);
      }
    });
}

function sortAndDisplayLegitT(movies, search) {

  $("#movies").empty();
	if(movies.length == 0)
	{
		var sorry = $("#sorry");

		if(sorry.length == 0)
		{
			$("#movies").after("<h3 id='sorry' align='center'>Sorry, no matching results</h1>");
		}
	}
// (Sort by rating)
  if (search.sort == 3) {

    movies.sort(function(a,b) {
      if (!a.rating && !b.rating) {
        return 0;
      }
      else if (a.rating && !b.rating) {
        return -1;
      }
      else if (!a.rating && b.rating) {
        return 1;
      }
      return (a.rating > b.rating) ? -1 : ((b.rating > a.rating) ? 1 : 0);
    });
}
// (Sort by date)
else if(search.sort == 2)
{
	movies.sort(function(a,b) {
		if (!a.year && !b.year) {
			return 0;
		}
		else if (a.year && !b.year) {
			return -1;
		}
		else if (!a.year && b.year) {
			return 1;
		}
		return (a.year > b.year) ? -1 : ((b.year > a.year) ? 1 : 0);
	});
}
// (Sort by title)
else if(search.sort == 0)
{
	movies.sort(function(a,b) {
		if (!a.title && !b.title) {
			return 0;
		}
		else if (a.title && !b.title) {
			return 1;
		}
		else if (!a.title && b.title) {
			return -1;
		}
		return (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0);
	});
}

$.ajax({
	method  : "GET",
	url     : "/home/movie_already_seen",
	error    : function(request, error) {
		//console.log("ERROR : " + error + " RESP : " + request.responseText);
	},
	success  : function(data) {
		var movie_list = data;
  movies.forEach(function (movie) {
    var display = 1;

    if (movie) {

      if (search.subject && search.subject != "") {
        //display = (movie.genres && (movie.genres.split(", ").indexOf(search.subject) != -1)) ? display : 0;
				display = (movie.genre && (movie.genre.indexOf(search.subject) != -1)) ? display : 0;
      }

      if (search.from && search.from != "") {
        display = (movie.year && (movie.year >= search.from)) ? display : 0;
      }
      if (search.to && search.to != "") {
        display = (movie.year && (movie.year <= search.to)) ? display : 0;
      }

      if (search.note1 && search.note1 != "") {
        display = (movie.rating
                    && (parseFloat(movie.rating) >= parseFloat(search.note1))) ? display : 0;
      }
      if (search.note2 && search.note2 != "") {
        display = (movie.rating
                    && (parseFloat(movie.rating) <= parseFloat(search.note2))) ? display : 0;
      }

			if (display) {
				// console.log("movie%  torrent:" + movie.torrent);
				// console.log("DISPLAY : " , movie);
				// console.log("LINK : http://localhost:8080/torrent/download/" + encodeURIComponent(movie.torrent));
				var movie_box = document.createElement('div');
				movie_box.className = "movie_container  col-lg-3 col-sm-4 col-xs-6";
				movie_box.onclick = function() {
					var url = '/torrent/download/' + encodeURIComponent(movie.torrent);
					register(movie.title);
					loadStreamPage(url, movie);
				};

			movie_box.innerHTML = '<div class="movie_box">' +
																	'<p class="movie_title">' + (((movie_list.match(movie.title) || []).length > 0) ? '<img style="width: 30px;" src="/img/pc5o5B8oi.png">' : '')+ movie.title + '</p>' +
																		'<img class="movie_img img-rounded img-responsive" src="' + movie.poster + '" alt="" title=""/>' +
																	'<p> IMDB: ' + movie.rating + ' YEAR: ' + movie.year+ '</p>' +
																'</div>';
															document.getElementById('movies').appendChild(movie_box);
			}
    }
  });
		// window.scrollTo(0,scrollHeight);
	}
	});
}

function scrapLegitTorrents(search, cb) {
  //console.log("LegitTorrent Search");
  $.ajax({
    method  : "GET",
    url     : "/home/legittorrenttest",
    data : {search  : search,
            page    : g_page},
    error    : function(request, error) {
      //console.log("ERROR : " + error + " RESP : " + request.responseText);
    },
    success  : function(data) {
      cb(JSON.parse(data));
    }
  });
}

  function search(){
			$("#sorry").remove();
    var archive = $('#archive:checked').length;
    var movie;
    //console.log("mickey");
    // $.ajax({
    //   method  : "GET",
    //   url     : "/home/movie_already_seen",
    //   error    : function(request, error) {
    //     //console.log("ERROR : " + error + " RESP : " + request.responseText);
    //   },
    //   success  : function(data) {
    //     //console.log("tournosol")
    //     //console.log(data);
    //
    //   }
    // });
		function escapeHtml(text) {
        var map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        if (text)
              return text.replace(/[&<>"']/g, function(m) { return map[m]; });
          return text;
    }
	//	var test = escapeHtml("<script>");
		var title = $('#title').val();
		var subject = $('#subject').val();
		var from = $('#from').val();
		var to = $('#to').val();
		var note1 = $('#note1').val();
		var note2 = $('#note2').val();
		var sort = $('#sort').val();
		var isArchiveProvider = $('#archive').prop("checked");
		//console.log("cacao");
		//console.log(title);
		//console.log(subject);

		if(title)
			title = escapeHtml(title);
		if(subject)
			subject = escapeHtml(subject);
		if(from)
			from = escapeHtml(from);
		if(to)
			to = escapeHtml(to);
		if(note1)
			note1 = escapeHtml(note1);
		if(note2)
			note2 = escapeHtml(note2);
		if(sort)
			sort = escapeHtml(sort);
	//	if(isArchiveProvider)
		//	isArchiveProvider = escapeHtml(isArchiveProvider);



    g_search = {
      title: title,
      subject: subject,
      from: from,
      to: to,
      note1: note1,
      note2: note2,
      sort: sort,
      isArchiveProvider: isArchiveProvider
    };
		//console.log("taratata");
		//console.log(g_search);

    //console.log("TITLE : " + search.title);
    //console.log("SUBJECT : " + search.subject);
    //console.log("FROM : " + search.from);
    //console.log("TO : " + search.to);
    //console.log("NOTE1 : " + search.note1);
    //console.log("NOTE2 : " + search.note2);
    //console.log("SORT : " + search.sort);

    g_movies = [];
    g_page = 1;

    $("#movies").empty();

    if(archive) {
      scrapArchiveOrg(g_search, function (movies) {
				//console.log("basterd :" + movies);
        g_movies = g_movies.concat(movies);
        sortAndDisplayArchive(movies, g_search);
      });
    } else {
      scrapLegitTorrents(g_search, function(movies){
        g_movies = g_movies.concat(movies);
				// console.log("Legit :");
				// console.log(movies);
        sortAndDisplayLegitT(g_movies, g_search);
      });
    }
  }

  scrapArchiveOrg(g_search, function (movies) {
    g_movies = g_movies.concat(movies);
		// console.log("basterd :");
		// console.log(movies);
    sortAndDisplayArchive(movies, g_search);
  });
