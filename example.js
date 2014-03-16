// require the module
var SFCOMPO = require('./NEA_SFCOMPO.js');

// EXAMPLE OF FUEL ROD DATA EXPORT

// this URL is taken from the table at the bottom of this page:
// http://www.oecd-nea.org/sfcompo/Ver.2/Eng/Obrigheim/index.html
// any of those URLs should work.
var url = 'http://www.oecd-nea.org/sfcompo/Ver.2/search/search.pl?rosin=Gundremmingen&cell=B23&pin=A1&axis=2680';

// call the function
//SFCOMPO.getFuelRodData(url, console.log);


// EXAMPLE OF REACTOR EXPORT
SFCOMPO.reactor('', function(fuelRodURLs) {

	for (i=0; i < fuelRodURLs.length;i++)
		SFCOMPO.getFuelRodData(fuelRodURLs[i], console.log);

});