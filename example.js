// require the module
var fuelRod = require('./NEA_SFCOMPO.js');

// this URL is taken from the table at the bottom of this page:
// http://www.oecd-nea.org/sfcompo/Ver.2/Eng/Obrigheim/index.html
// any of those URLs should work.
var url = 'http://www.oecd-nea.org/sfcompo/Ver.2/search/search.pl?rosin=Gundremmingen&cell=B23&pin=A1&axis=2680';

// call the function
fuelRod.getFuelRodData(url, console.log);
