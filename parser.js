var fs = require('fs');
var http = require('http');
var Transform = require('stream').Transform;
var csv = require('csv-streamify');
var JSONStream = require('JSONStream');

//3rd argument in node command is text file to be readed
var fdfFile = process.argv[3];
fs.readFile(fdfFile, function(err, data){
	if (err) throw err;
	var text = data.toString();
	var arr = text.split('\r\n');
	var lengths = [];
	var decimals = [];
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
		
	}

	var csvToJson = csv({objectMode: true});
	var j = 0;
	var parser = new Transform({objectMode: true});
	parser._transform = function(data, encoding, done) {
			for(var i = 0; i < data.length; i++) {
				//remove all commas which mainly come from numbers
				data[i] = data[i].replace(/,/g, '');
				if (data[i] == 'A001169415'){
					data[i] = 'B001169415';
				}
				//remove whitespace in strings
				data[i] = data[i].replace(/ /g,'');
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
				if (i === data.length - 1){
					whitespace++;
				};
				//pad out the value with blanks at the beginning
				data[i] = new Array(whitespace + 1).join(' ') + data[i];
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


	process.stdout.on('error', process.exit);

});