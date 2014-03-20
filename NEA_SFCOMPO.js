// Webscraping app to get radioactive data from http://www.oecd-nea.org/sfcompo/Ver.2/Eng/index.html
// for use in radioactive.js visualizations
//  visualizations: http://rein.pk/radioactive-js/
//  library: https://github.com/reinpk/radioactive
// Copyright The Things They Coded, 2014
// The MIT License (see included License file)

// BIBLIOGRAPHY (TODO - write blog post about this)
// http://rein.pk/radioactive-js/
// http://rein.pk/javascripts/posts/radioactive-js-examples.js
// http://www.oecd-nea.org/sfcompo/Ver.2/Eng/index.html
// http://blog.miguelgrinberg.com/post/easy-web-scraping-with-nodejs
// http://www.w3schools.com/jsref/jsref_indexof.asp
// http://www.w3schools.com/jsref/jsref_substring.asp
// http://www.w3schools.com/jsref/jsref_parsefloat.asp
// http://stackoverflow.com/questions/1168807/how-can-i-add-a-key-value-pair-to-a-javascript-object-literal
// https://www.digitalocean.com/community/articles/how-to-use-node-js-request-and-cheerio-to-set-up-simple-web-scraping

// TO DO
// - integrate into http://rein.pk/javascripts/posts/radioactive-js-examples.js
// - write upper level function to parse http://www.oecd-nea.org/sfcompo/Ver.2/Eng/Obrigheim/index.html
//    which would then call this function for each reactor rod
// - Then go a step up for each reactor itself
// - Add unit tests to ensure that the expected format of the source html
//    hasn't changed

// pre-reqs
var request = require('request');
var cheerio = require('cheerio');
var E = function (exp) {
	return Math.pow(10, exp);
};

// get the fuel rod data that is to be used as input for the decay graph
exports.getFuelRodData = function(url, onResult) {					

  // initialize variables
	var radioactiveTimeSeriesData = {};
	var fueldRodData = {};

	request(url, function(err, resp, body) {
		if (err)
			throw err;
	
		// get the body of the page we requested
		$ = cheerio.load(body);
	
		// get the descriptive information contained within the pre tag
		// this will give us the reactor name, rod position, etc.
		// This data is not particularly tagged well, so we are going to brute
		// parse the html within the pre tag instead of using something more 
		// elegant like the selectors we use when pulling out the isotope data below
		// <pre>
		// <i> key </i> value
		// <i> key </i> value
		// </pre>
		var aryDescriptors = $('pre').html().split('<i>');
		for (i = 0; i < aryDescriptors.length; i++) {
			// when splitting on the <i> we get an entry in the array that is throw
			// away data (white space before the first <i>) so we need to skip any
			// of these type of entries by checking for the </i>
			if (aryDescriptors[i].indexOf('</i>') > -1) {
				var thisDescriptor = aryDescriptors[i].split('</i>');
				// there is a lot of white space using this parsing approach,
				// so we need to trim each here
				fueldRodData[thisDescriptor[0].trim()] = thisDescriptor[1].trim();
			}
		}
	
		// TO DO:
		// build the column headers by selecting from the body $('table th')
		// so that this is responsive to differently positioned tables
		// note: this step wouldn't actually buy us much in terms of generalization
		//  due to the row parsing that is done below, so may be best to leave this
		//  is for now and build an asserts around these values
		var columnHeaders = ['No.','Data Type','Initial U-235 Enrichment[wt percent]',
						'Data as of cooling time[year]','Values','Unit',
						'Measurement Laboratory'];

	
		// there is a single table on this page that contains all of the data,
		// grab each row from that table for further processing
		$('table tr').each(function() { 
	
			var dataType = '';
			var value = '';
			var base = 0;
			var exponent = '';
			var unit = '';
		
			// each row contains multiple cells, inspect the contents of each cell
			// and only grab the data we (might) need. [note: we don't perform the
			// trims here since there are many rows that we won't use so no point
			// in performing that processing if we just throw out the value.]
			$(this).find('td').each(function(column) {
				if (columnHeaders[column] == 'Data Type')
					dataType = $(this).text();
				if (columnHeaders[column] == 'Values')
					value = $(this).text();
				if (columnHeaders[column] == 'Unit')
					unit = $(this).text();
			});
		
			// The table contains a lot of data, but best as I can tell, the only
			// ones we are interested in are the initial fuel loads
			if (unit.indexOf('initial') > -1 && dataType.indexOf('Total') == -1 && dataType.indexOf('Depletion') == -1) {
				// clean up the dataType value to just the text we want
				// TO DO: make this use a reg-ex A(A)-###
				dataType = dataType.trim();
				if (dataType.indexOf(' ') > -1)
					dataType = dataType.substring(0, dataType.indexOf(' '));
			
				// parse the numbers correctly
				// from webpage:	1.400E-01
				// desired equation:	1.400*E(-1) * 15 / 1.344,
				value = value.trim();
				base = parseFloat(value.split('E')[0]);
				exponent = parseFloat(value.split('E')[1].replace('+', ''));
			
				// add this value to the time series data (applying equation here)
				radioactiveTimeSeriesData[dataType] = base * E(exponent) * 15 / 1.344;
			}
		
		});
	
		// add the time series data to the reactor object
		fueldRodData['data'] = radioactiveTimeSeriesData;
	
		// DEBUG OUTPUT
		//console.log(fueldRodData);
	
		// pass the data to the handler function
		onResult(fueldRodData);
	
	}); // end request
	
} // end exports fuelRod

// TO DO - implement this
// example input url: http://www.oecd-nea.org/sfcompo/Ver.2/Eng/Obrigheim/index.html
// returns an object containing the urls for each fuel rod
// example output: {'http://www.oecd-nea.org/sfcompo/Ver.2/search/search.pl?rosin=Obrigheim&cell=BE124&pin=D1&axis=315'}
exports.reactor = function(url, onResult) {

	// Easy path forward:
	// grab each link and look to see if it's the fuel rod search page (search.pl)
	// More difficult:
	// attempt to grab all the other data about the reactor.
	
	var url = 'http://www.oecd-nea.org/sfcompo/Ver.2/Eng/Obrigheim/index.html';
	var fuelRods = [];
	
	request(url, function(err, resp, body) {
		if (err)
			throw err;

		// get the body of the page we requested
		$ = cheerio.load(body);

		// get the fuel rod information
		// find all the anchor tags
		$('td a').each(function() { 
		
			//grab the href from the tag
			var fuelRodURL = $(this).attr('href');
			
			if (fuelRodURL.indexOf('search.pl') > 0) {
			
				// translate this into an absolute URL
				// (doing quick and dirty since we know the page we are scraping)
				fuelRodURL = url.replace('index.html', '')+fuelRodURL;
				
				// debug
				//console.log(fuelRodUrl);
				
				// add the url to the fuelRods array
				fuelRods.push(fuelRodURL);
			}
		});
		
		// pass the URLs to the handler function
		onResult(fuelRods);
		
	}); // end request

} //end reactor
