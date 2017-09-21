var profile_pic;
$("#registration_container").load("/htmlImport/registrationForm.html", null, function() {
	uploadProfilePicEvt();
	$("#member_register").click(function(e) {
		e.preventDefault();
		$.ajax({
			url: "/reg",
			type: "POST",
			data: {
				first_name: $('input[name="first_name"]').val(),
				last_name: $('input[name="last_name"]').val(),
				email: $('input[name="email"]').val(),
				pseudo: $('input[name="pseudo"]').val(),
				password: $('input[name="password"]').val(),
				password_confirmation: $('input[name="password_confirmation"]').val(),
				profile_pic: profile_pic
			},
			success: function(user) {
				if (user.first_name == true || user.last_name == true ||
					user.email == true || user.email_exist == true ||
					user.pseudo == true || user.pseudo_exist == true ||
					user.password == true || user.password_confirmation == true ||
					user.profile_pic == true) {
					$("#reg_success").removeClass('hidden').addClass('hidden');
					alert('some fields are incorrect/missing');
				}
				else
					$("#reg_success").removeClass('hidden');
				registerCheck(user);
			}
		});
	});
});
var submit_login = function(e) {
	e.preventDefault();
	$.ajax({
		url: "/login",
		type: "POST",
		data: {
			login: $('#user_id').val(),
			password: $("#user_pwd").val()
		},
		success: function(user) {
			if (user.login == true || user.pwd == true) {
				$("#pwd_forgot").tooltip();
				$("#pwd_forgot").removeClass('hidden');
				$("#pwd_forgot").attr("data-original-title", "password forgotten ?");
				$(".navbar-form").css("padding-right", "10px");
			}
			loginCheck(user, $('#user_id').val());
		}
	});
}
$('#user_submit').parent().submit(submit_login);
$("#id_check").click(submit_login);

$("#pwd_forgot").click(function(e) {
	$("#pwd_forgot_email_success").removeClass('hidden').addClass('hidden');
	$("#pwd_forgot_email").removeClass('hidden');
});

$("#pwd_forgot_email_confirm").click(function(e) {
	e.preventDefault();
	$.ajax({
		url: "/pwd_forgot",
		type: "POST",
		data: {
			email: $("#user_email").val()
		},
		success: function(data) {
			pwdForgotCheck(data);
		}
	});
});

if (window.location.hash && window.location.hash.substring(1, 4) == 'tkn') {
	$("#registration_container").load("/htmlImport/newPwdForm.html", null, function() {
		$('.centered-form').removeClass('hidden').addClass('hidden');
		$("#new_pwd_confirm").click(function() {
			var tkn = window.location.hash.substring(5);
			$.ajax({
				url: "/pwd_reset",
				type: "POST",
				data: {
					token: tkn,
					new_pwd: $("#user_new_pwd").val()
				},
				success: function(data) {
					pwdChangeCheck(data);
				}
			});
		});
	});
}

function uploadProfilePicEvt() {
	$("#upload_profile_picture_btn").on('change', function(e) {
		if ($('#profile_picture_container').children().length == 0) {
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
	});
}
function profilePicDelEvt() {
	$('#profile_pic').dblclick(function() {
		var deleteConfirm = confirm('Do you want to delete this picture ?');

		if (deleteConfirm == true)
			$('#profile_pic').remove();
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

function pwdChangeCheck(data) {
	if (data.valid_pwd == false)
		ttError($('input[name="new_pwd"]'), "Must contains between 5 and 255 chars and at least one number or maj char");
	else {
		$("#new_pwd_container").removeClass('hidden').addClass('hidden');
		$("#pwd_change_success").removeClass('hidden');
		ttSuccess($('input[name="new_pwd"]'), '');
	}
}
function pwdForgotCheck(data) {
	if (data.email_exist == false)
		ttError($('input[name="user_email"]'), "Incorrect email");
	else {
		ttSuccess($('input[name="user_email"]'), '');
		$("#pwd_forgot_email").removeClass('hidden').addClass('hidden');
		$("#pwd_forgot_email_success").removeClass('hidden');
	}
}
function registerCheck(user)
{
	if (user.first_name == true)
		ttError($('input[name="first_name"]'), "Must contains between 2 and 40 chars and only chars and/or numbers");
	else
		ttSuccess($('input[name="first_name"]'), '');
	if (user.last_name == true)
		ttError($('input[name="last_name"]'), "Must contains between 2 and 40 chars and only chars and/or numbers");
	else
		ttSuccess($('input[name="last_name"]'), '');
	if (user.email == true)
		ttError($('input[name="email"]'), "Invalid email format");
	else if (user.email_exist == true)
		ttError($('input[name="email"]'), "Email already exist");
	else
		ttSuccess($('input[name="email"]'), '');
	if (user.pseudo == true)
		ttError($('input[name="pseudo"]'), "Must contains between 2 and 12 chars");
	else if (user.pseudo_exist == true)
		ttError($('input[name="pseudo"]'), "Pseudo already exist");
	else
		ttSuccess($('input[name="pseudo"]'), '');
	if (user.password == true)
		ttError($('input[name="password"]'), "Must contains between 5 and 255 chars and at least one number or maj char");
	else
		ttSuccess($('input[name="password"]'), '');
	if (user.password_confirmation == true)
		ttError($('input[name="password_confirmation"]'), "Password confirm must be same as password");
	else
		ttSuccess($('input[name="password_confirmation"]'), '');

}
function loginCheck(user, pseudo)
{
	if (user.login == true || user.pwd == true) {
		ttError($('#user_id'), "Incorrect login or password");
		ttError($('#user_pwd'), "Incorrect login or password");
	}
	else
	{
		ttSuccess($('#user_id'), '');
		ttSuccess($('#user_pwd'), '');
		window.location = '/home';
	}
}

var dict = {
  "Already a member ? ": {
    fr: "Déjà membre ?",
		en: "Already a member ?"
  },
  "Login": {
    fr: "se connecter",
    en: "Login"
  },
	"Log in with 42": {
    fr: "se connecter avec 42",
    en: "Log in with 42"
  },
	"Log in with Github": {
    fr: "se connecter avec Github",
    en: "Log in with Github"
  },
	"Log in with Reddit": {
    fr: "se connecter avec Reddit",
    en: "Log in with Reddit"
  },
	"Log in with Google": {
    fr: "se connecter avec Google",
    en: "Log in with Google"
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
	var tab = $(".input-sm");
	tab[0].setAttribute("placeholder", "Prénom");
	tab[1].setAttribute("placeholder", "Nom");
	tab[2].setAttribute("placeholder", "Adresse mail");
	tab[4].setAttribute("placeholder", "Mot de passe");
	tab[5].setAttribute("placeholder", "Confirmation du mot de passe");
	//console.log(tab);
	//console.log(tab[1]);
	//console.log(typeof(tab[1]));
	var tab2 = $(".red-tooltip");
	tab2[1].setAttribute("placeholder", "Mot de passe");
	//console.log(tab2);
	//tab[1].setAttribute("placeholder", "singeblanc");
	//console.log("tableau");
	var tab3 = $(".btn-block");
	tab3[0].setAttribute("value", "s'enregistrer");
});

$("#language-en").click(function(e) {
	//console.log("tata")
	var translator = $('body').translate({lang: "fr", t: dict}); //use English
	translator.lang("en");
	$("#language").attr('src',"/img/flag-gb.png");
	$("#language-enA").attr('class',"active");
	$("#language-frA").removeClass("active");
	var tab = $(".input-sm");
	tab[0].setAttribute("placeholder", "First name");
	tab[1].setAttribute("placeholder", "Last name");
	tab[2].setAttribute("placeholder", "Email adress");
	tab[4].setAttribute("placeholder", "Password");
	tab[5].setAttribute("placeholder", "Confirm password");
	//console.log("tabla");
	var tab2 = $(".red-tooltip");
	tab2[1].setAttribute("placeholder", "Password");
	var tab3 = $(".btn-block");
	tab3[0].setAttribute("value", "Register");
	//console.log(tab);
});
