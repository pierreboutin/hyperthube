$('header').load('/generic/html/header.html',function() {
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
	  "My profile": {
	    fr: "Mon profil",
			en: "My profile"
	  },
	  "Research": {
	    fr: "Recherche",
	    en: "Research"
	  },
		"All profiles": {
	    fr: "tous les profiles",
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
		"Subject Filter": {
		 fr: "filtrer par thème",
		 en: "Subject Filter"
	 },
	 "Production date filter": {
		fr: "filtrer par date de production",
		en: "Production date filter"
	},
	"Subject Filter": {
	 fr: "filtrer par thème",
	 en: "Subject Filter"
 },
 "Imdb note filter": {
	fr: "filtrer par note Imdb",
	en: "Imdb note filter"
},
"sort by": {
 fr: "trier par",
 en: "sort by"
},
"title": {
 fr: "titre",
 en: "title"
},
"subject": {
 fr: "thème",
 en: "subject"
},
		"Update": {
	    fr: "mettre à jour",
	    en: "Update"
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


});

$(document).ready(function() {
	getProfileInfo();
});

var profile_pic;
updateProfile();
uploadProfilePicEvt();

function getProfileInfo() {
	$.get('/home/myProfile/user_info_exists', function(user) {
		$("#firstName").val(user.first_name);
		$("#lastName").val(user.last_name);
		$("#email").val(user.email);
		$("#birthDate").val(user.birth_date);
		$("input[value=" + user.gender + "]").prop("checked", true);
		$("#bio").val(user.about_user);
		$("input[value=" + user.geolocate + "]").prop("checked", true);
		if (user.profile_picture_path) {
			$("#profile_picture_container").append('<img tabindex="0"' +
				' style="height:150px;width:23%;margin-right:3px" src="' +
				user.profile_picture_path + '" class="img-rounded" id="profile_pic">');
			profile_pic = user.profile_picture_path;
		}
		if ($("#profile_picture_container").children().length > 0) {
			profilePicDelEvt();
			profile_pic = $("#profile_picture_container").children()[0].src;
		}
	});
}

function updateProfile() {
	$("#profile_update_btn").click(function(e) {
		e.preventDefault();

		$.ajax({
			url: '/home/myProfile/update_profile',
			type: 'POST',
			data: {
				first_name: $("#firstName").val(),
				last_name: $("#lastName").val(),
				email: $("#email").val(),
				birth_date: $("#birthDate").val(),
				gender: $("input[name='gender']:checked").val(),
				bio: $("#bio").val(),
				profile_picture: profile_pic
			},
			success: function(user) {
				var updateSuccess = profileCheck(user);

				if (typeof user.profile_picture_path !== 'undefined')
					$("#profile_picture_container").children()[0].src = user.profile_picture_path;
				if ($("#profile_picture_container").children().length > 0) {
					profile_pic = $("#profile_picture_container").children()[0].src;
				}
				if (updateSuccess == true)
					alert('profile successfully updated !');
				else
					alert('some fields are missing / incorrects');
			}
		});
	});
}

function uploadProfilePicEvt() {
	$("#upload_profile_picture_btn").on('change', function(e) {
		if ($("#profile_picture_container").children().length < 1) {
			var reader = new FileReader();
			reader.onload = function(e) {
				checkFileSize(e.target.result, function(profilePicOK) {
					if (typeof profilePicOK !== 'undefined') {
						$("#profile_picture_container").append(`<img tabindex="0"
							'style="height:150px;width:25%;" class="img-rounded" id="profile_pic">`);
						$('#profile_pic').attr("src", e.target.result);
						profile_pic = e.target.result;
						profilePicDelEvt();
					}
				});
			};
			reader.readAsDataURL($("#upload_profile_picture_btn")[0].files[0]);
		}
		else
			alert('You can have only one picture profile');
	});
}
function profilePicDelEvt() {
	$('#profile_pic').dblclick(function() {
		var deleteConfirm = confirm('Do you want to delete this picture ?');

		if (deleteConfirm == true) {
			if (/^data:image\/(png|jpg|jpeg);base64/.test($('#profile_pic').src)) {
				$('#profile_pic').remove();
				uploadProfilePicEvt();
			}
			else {
				$.ajax({
					url: '/home/myProfile/user_profile_picture_delete',
					type: 'POST',
					data: {
						'profile_pic_src' : $('#profile_pic').src
					},
					success: function(data) {
						$('#profile_pic').remove();
					}
				});
			}
		}
	});
}
function checkFileSize(file, cb) {
	$.ajax({
		url : '/home/myProfile/file_size_check',
		type: 'POST',
		data: file,
		success : function(data) {
			if (data == 'bodySizeErr') {
				alert('your picture is too large, 2mb is the limit');
				cb();
			}
			else
				cb('profilePicOK');
		}
	});
}
function profileCheck(user)
{
	if (user.first_name == true)
		ttError($('#firstName'), "Must contains between 2 and 40 chars and only chars and/or numbers");
	else
		ttSuccess($('#firstName'), '');
	if (user.last_name == true)
		ttError($('#lastName'), "Must contains between 2 and 40 chars and only chars and/or numbers");
	else
		ttSuccess($('#lastName'), '');
	if (user.email == true)
		ttError($('#email'), "Invalid email format");
	else if (user.email_exist == true)
		ttError($("#email"), "Email already exist");
	else
		ttSuccess($('#email'), '');
	if (user.birth_date == true)
		ttError($('#birthDate'), "You are not over 18 or date is invalid(YYYY-MM-DD, if no date input)");
	else
		ttSuccess($('#birthDate'), '');
	if (user.about_user == true)
		ttError($('#bio'), "Must contains between 4 and 500 chars and must contains valid char and/or number");
	else
		ttSuccess($('#bio'), '');

	var userKey = ['first_name', 'last_name', 'email', 'email_exist',
		'birth_date', 'about_user', 'profile_picture'];
	var validUpdate = true;
	for (var i = 0; i < userKey.length; i++) {
		if (user[userKey[i]] == true)
			validUpdate = false;
	}
	//console.log(validUpdate);
	return (validUpdate);
}
