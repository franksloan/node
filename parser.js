var fs = require('fs');
var http = require('http');
var Transform = require('stream').Transform;
var csv = require('csv-streamify');
var JSONStream = require('JSONStream');

//3rd argument in node command is text file to be readed
var fdfFile = process.argv[3];
fs.readFile(fdfFile, function(err, data){
	if (err) throw err;
	var text = data.toString()
	//create new array of .txt FDF file using carriage returns or new lines to separate
	, arr = text.split('\r\n')
	, lengths = []
	, decimals = []
	, types = [];
	for(var i = 0; i < arr.length; i++) {		
		if (arr[i].search('Length') >= 0) {
			//create an array of field lengths
			lengths.push(arr[i].substring(7));
			//create an array of decimal places or 0 if no decimals
			if (arr[i+4].search('Scale') >= 0) {
				decimals.push(parseInt(arr[i+4].substring(6)));
			} else {
				decimals.push(0);
			}
		}
		if (arr[i].search('Type') == 0) {
			// get the different types so program knows how to pad out numbers/characters
			if(parseInt(arr[i].substring(5)) !== 1 && parseInt(arr[i].substring(5)) !== 2) {
				console.log('There was a problem with the type values');
			} else {
				types.push(parseInt(arr[i].substring(5)));
			}
		}
		
	}
	if((lengths.length === decimals.length) && (lengths.length === types.length)) {
		console.log('.txt version of FDF file read successfully, starting parsing csv data');
	} else {
		console.log('Error reading formats and types of field from .txt version of FDF file');
		return;
	}
	var csvToJson = csv({objectMode: true});
	var j = 0;
	var parser = new Transform({objectMode: true});
	parser._transform = function(data, encoding, done) {
			for(var i = 0; i < data.length; i++) {
				//remove all commas which mainly come from numbers
				data[i] = data[i].replace(/,/g, '');
				//use this structure to change any data to something else
				//e.g. I have changed agreement number here
				if (data[i] == 'A001169415'){
					data[i] = 'B001169415';
				}
				//if there is a problem with uploading blanks 
				//uncomment out line below which removes whitespace in strings
				// data[i] = data[i].replace(/ /g,'');

				//there is a decimal portion for this element
				if (decimals[i] > 0) {
					var decimalPart = parseFloat(data[i]) - parseInt(data[i]);
					// if no decimal places when there should be add . and 0s
					if(decimalPart === 0) {
						var decimalString = '.' + new Array(decimals[i] + 1).join('0');
						data[i] += decimalString;
					} else {
						//make sure end of the decimal is padded out with enough 0s
						var addZeros = decimals[i] - data[i].substring(data[i].indexOf('.') + 1).length;
						data[i] += new Array(addZeros + 1).join('0');
					}
				}
				//
				var whitespace = lengths[i] - data[i].length;
				//if end of line add an extra whitespace (update identifier field) 
				if (i === data.length - 1){
					whitespace++;
				};
				//pad out the value with blanks at the beginning if number
				if(types[i] === 2) {
					data[i] = new Array(whitespace + 1).join(' ') + data[i];
				} else {
					//pad out after if data is character field
					data[i] =  data[i] + new Array(whitespace + 1).join(' ');
				}				
			}
			data = data.join('');
			this.push(data);
			done();
	}

	var jsonToStrings = JSONStream.stringify(false);
	var fileOutput = process.argv[2];
	var newFile = fs.createWriteStream(fileOutput);

	process.stdin
	.pipe(csvToJson)
	.pipe(parser)
	.pipe(jsonToStrings)
	.pipe(newFile);

	console.log('\nCSV file converted');
	process.stdout.on('error', process.exit);

});