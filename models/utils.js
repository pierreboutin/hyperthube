module.exports = {
	escapeHtml(text) {
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
	},
	getAge(birth_date) {
		if (birth_date.split('-').length - 1 == 0)
			return -1;

		var Year = birth_date.split('-')[0]
		var Month = birth_date.split('-')[1]
		var Day = birth_date.split('-')[2]
		var today = new Date();
		var age = today.getFullYear() - Year;
		var m = today.getMonth() - Month;

		if (m < 0 || (m === 0 && today.getDate() < Day))
			age--;
		return age;
	},
	cleanEmptyFoldersRecursively(folder) {
		var fs = require('fs');
		var path = require('path');

		var isDir = fs.statSync(folder).isDirectory();
		if (!isDir) {
			return;
		}
		var files = fs.readdirSync(folder);
		if (files.length > 0) {
			files.forEach((file)=>{
				var fullPath = path.join(folder, file);
				this.cleanEmptyFoldersRecursively(fullPath);
			});
			files = fs.readdirSync(folder);
		}
		if (files.length == 0) {
			//console.log("removing: ", folder);
			fs.rmdirSync(folder);
			return;
		}
	},
}
