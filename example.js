// require the module
var SFCOMPO = require('./NEA_SFCOMPO.js');

// EXAMPLE OF SINGLE FUEL ROD DATA EXPORT
//  This URL is taken from the table at the bottom of this page:
//  http://www.oecd-nea.org/sfcompo/Ver.2/Eng/Obrigheim/index.html
//  any of those URLs should work.
//var url = 'http://www.oecd-nea.org/sfcompo/Ver.2/search/search.pl?rosin=Gundremmingen&cell=B23&pin=A1&axis=2680';
//SFCOMPO.getFuelRodData(url, console.log);


// EXAMPLE OF REACTOR EXPORT
//  This URL is takes from the table on this page: 
//  http://www.oecd-nea.org/sfcompo/Ver.2/Eng/index.html
//var url = 'http://www.oecd-nea.org/sfcompo/Ver.2/Eng/Obrigheim/index.html';
//SFCOMPO.reactor(url, console.log);


// EXAMPLE OF SCRAPING THE WHOLE SITE (TBD)
var url = 'http://www.oecd-nea.org/sfcompo/Ver.2/Eng/index.html';
SFCOMPO.NEA_SFCOMPO(url, console.log);