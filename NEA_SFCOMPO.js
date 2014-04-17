// Webscraping app to get radioactive data from
//	http://www.oecd-nea.org/sfcompo/Ver.2/Eng/index.html
// For use in radioactive.js visualizations so that radioactive.js
//	examples don't have to transpose / hardcode the data objects
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
// https://github.com/cheeriojs/cheerio

// TO DO
// - Integrate into http://rein.pk/javascripts/posts/radioactive-js-examples.js
// - Add unit tests to ensure that the expected format of the source html
//    hasn't changed
// - Add better error handling
// - Add cacheing layer so that we don't have to rescrape the data every time
//		we want to display a graph.

// pre-reqs
var request = require('request');
var cheerio = require('cheerio');
var E = function (exp) {
	return Math.pow(10, exp);
};

// get the fuel rod data that is to be used as input for the decay graph
exports.getFuelRodData = function(url, onResult) {

	//debug
	//console.log('FuleRodURL:' + url)

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


// example input url: http://www.oecd-nea.org/sfcompo/Ver.2/Eng/Obrigheim/index.html
// returns an object containing information about the reactor, including an
// object containing the data for each fuel rod
// TO DO - make sure that the page structure is the same for each reactor!!!
exports.reactor = function(url, onResult) {
	
	// TO DO - make this default if a url is not passed in
	//var url = 'http://www.oecd-nea.org/sfcompo/Ver.2/Eng/Obrigheim/index.html';
	
	// this object holds all of the data and will be passed to onResult
	var reactor = {};
	
	request(url, function(err, resp, body) {
		if (err)
			throw err;

		// get the body of the page we requested
		$ = cheerio.load(body);
		
		// get the reactor name
		// this value happens to be in the table data, but is formatted slightly 
		// differently so we're just going to grab it from the H1s
		reactor['Reactor Name'] = $('h1').eq(1).text();
		
		// Get the reactor data from the various tables on the page
		// (we are skipping the third table for now, per comment below)
		$('table').each(function(tableIndex) {
		
			//grab reactor information from the first two tables
			if (tableIndex == 0 || tableIndex == 1) {
				$(this).find('tr').each(function() {
		
					var key = '';
					var value = '';
			
					if (tableIndex == 0) {
						// this is a goofy table where the left column is a th and the right 
						// column is a tr, there are also th cells that span rows, we can ignore
						// those for now.  The HTML looks like:
						//<tr> 
						//  <th colspan="2" class="bodytext">Reactor Name</th>
						//  <th width="7%" class="bodytext"><i>Obrigheim</i></th>
						//</tr>
						//<tr> 
						//  <th rowspan="4" width="6%" class="bodytext">Fuel Pin</th>
						//  <th width="8%" class="bodytext">Fuel Pellet Diameter (mm)</th>
						//  <td width="7%" class="bodytext"> 
						//    <div align="center">9.04</div>
						//  </td>
						//</tr>
						// we can grab the td from the row, and then grab the previous DOM element
						// to get the right-most th.
						
						// start by finding the td element itself
						var td = $(this).find('td');
						
						// the text of the td is the value for this key
						value = td.children().eq(0).text();
						
						// the key is the right-most th element, which is the DOM element
						// previous to the td where the value is stored
						key = td.prev().text();
						
					}
					else if(tableIndex == 1) {
					// this table only uses th without any tr, so that makes sense (not).
					// first column is the description, second is the associated value
					//<tr> 
					//	<th class="bodytext">Rod array</th>
					//	<th class="bodytext">14 x 14</th>
					//</tr>
						$(this).find('th').each(function(column) {
							if (column == 0)
								key = $(this).text().trim();
							if (column == 1)
								value = $(this).text().trim();
						});
					}
			
					// Add the values to our reactor object
					if(key.length > 0 && value.length > 0) {
						reactor[key] = value;
					}
			
				}); // end row traversal
			} // end reactor tables
			
			// we are currently ignoring the third table
			// 1) I don't understand it
			// 2) it doesn't fit neatly into our key:value paradigm
			// (at least I'm honest, right?)
			
			// grab fuel rod data from the fourth table
			else if (tableIndex == 3) {
				
				// initiate object within the reactor
			  reactor['fuelRodData'] = [];
				
				// figure out how many anchor tags there are so that we know when to 
				// finally call the onResult (see fix note below)
				var tableCellsFound = $(this).find('td a').length;
				
				// process all of the anchor tags
				$(this).find('td a').each(function(i) { 
		
					//grab the href from the tag
					var fuelRodURL = $(this).attr('href');
			
					// there are a few different links in the table, but the only ones
					// we are interested in are to the search.pl page, which is the page
					// with the fuel rod info
					if (fuelRodURL.indexOf('search.pl') > 0) {
			
						// translate this into an absolute URL
						// (doing quick and dirty since we know the page we are scraping)
						fuelRodURL = url.replace('index.html', '')+fuelRodURL;

						// pass this URL into the fuel rod scraper module above to get all
						// the data for the fuel rod and place it into the reactor object
						exports.getFuelRodData(fuelRodURL, function (fuelRodObj) {
						
							// the resultant object is then added to our overall reactor object
							reactor['fuelRodData'].push(fuelRodObj);
							
							// If this is the last link on the page we can now call the 
							// overarching onResult function.
							// FIX ME!!!! THIS ONLY WORKS IF THE LAST LINK IS TO FUEL ROD
							// DATA.  If the last link is to something else this will never
							// get called.  We could move the search.pl if block into this
							// function but that seems like it breaks modularity.  
							if ((i+1) == tableCellsFound) {
							  onResult(reactor);
							}
						
						});
						
					} // end if fuel rod link
					
				}); // end link traversal

			} // end fuel rod table
						
		}); // end table traversal
		
	}); // end request

} //end reactor


// THIS IS NOT YET IMPLEMENTED OR TESTED
/*
exports.NEA_SFCOMPO = function(url, onResult) {

	// check for non existence of this param and use this as default?
	var url = "http://www.oecd-nea.org/sfcompo/Ver.2/Eng/index.html"
	var SFCOMPO = [];
	
	request(url, function(err, resp, body) {
		if (err)
			throw err;

		// get the body of the page we requested
		$ = cheerio.load(body);
		
		$('td a').each(function() { 
		
			//grab the href from the tag
			var reactorURL = $(this).attr('href');
			
			//debug
			console.log(reactorURL);

			// pass this URL into the reactor scraper module above to get all
			// the data for the reactor and place it into the SFCOMPO object
			exports.reactor(reactorURL, function(reactorObj) {
				SFCOMPO.push(reactorObj);
			});
			
		}); // end link traversal

	}); // end request
	
}
*/