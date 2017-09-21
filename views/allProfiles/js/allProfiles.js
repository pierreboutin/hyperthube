$('header').load('/generic/html/header.html');

$.get('/home/allProfiles/usersData', function(hypertubeUsers) {
	hypertubeUsers.forEach(function(hypertubeUser) {
		var pseudoName = createPseudoNameTag(hypertubeUser);
		pseudoNameCss(pseudoName);
		$('#hypertube_users_container').find('a:contains("' + pseudoName.html() + '")').remove();
		$('#hypertube_users_container').append(pseudoName);
	});
});

function createPseudoNameTag(hypertubeUser) {
	//console.log(hypertubeUser);
	var age = gender = profile_picture = bio = 'unknown';

	if (typeof hypertubeUser.birth_date !== 'undefined')
		age = getAge(hypertubeUser.birth_date);
	if (typeof hypertubeUser.gender !== 'undefined')
		gender = hypertubeUser.gender;
	if (typeof hypertubeUser.bio !== 'undefined')
		bio = hypertubeUser.bio;

	var pseudoName = $(
		'<a id=' + hypertubeUser.pseudo + '><div>'+
			'<h5 style="border: 2px solid #34495e; padding:4px; margin-top: 0px;' +
			' border-radius: 5px; font-weight: bold; overflow: auto;" >' +
			hypertubeUser.pseudo + '</h5>' +
			'<h5> first name: ' + hypertubeUser.first_name + '</h5>' +
			'<h5> last name: ' + hypertubeUser.last_name + '</h5>' +
			'<h5> age: ' + age + '</h5>' +
			'<h5> gender: ' + gender + '</h5>' +
			'<h5> about: ' + bio + '</h5>' +
		'</div></a>'
	);
	if (typeof hypertubeUser.profile_picture_path !== 'undefined') {
		var profilePicImg = $(
			'<img src="' + hypertubeUser.profile_picture_path +
			'" class="img-rounded"/>'
		);
		profilePicCss(profilePicImg);
		$(pseudoName.find('h5')[0]).after(profilePicImg);
	}
	return pseudoName;
}

function pseudoNameCss(pseudoName) {
	pseudoName.css({
		'word-wrap': 'break-word',
		overflow: 'auto',
		'background-color': '#BDC3C7',
		color: '#F2F1EF',
		display: 'inline-block',
		'border-radius': '5px',
		'font-weight': 'bold',
		padding: '7px',
		'margin-right': '10px',
		width: '22%',
		height: '180px',
		cursor: 'default',
		'vertical-align': 'top'
	});
}

function profilePicCss(pseudoName)
{
	pseudoName.css({
		height: '80px',
		width:'80%'
	});
}

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
	"Not a member ? You may register !": {
    fr: "Tu n'es pas membre ? Enregistres toi !",
    en: "Not a member ? You may register !"
  }
}

$("#language-fr").click(function(e) {
	//console.log("tata")
	var translator = $('body').translate({lang: "en", t: dict}); //use English
	translator.lang("fr");
	$("#language").attr('src',"/img/flag-fr.png");
	$("#language-frA").attr('class',"active");
	$("#language-enA").removeClass("active");

});
$("#language-en").click(function(e) {
	//console.log("tata")
	var translator = $('body').translate({lang: "fr", t: dict}); //use English
	translator.lang("en");
	$("#language").attr('src',"/img/flag-gb.png");
	$("#language-enA").attr('class',"active");
	$("#language-frA").removeClass("active");

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
