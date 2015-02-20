var fs = require('fs');
var http = require('http');
var Transform = require('stream').Transform;
var csv = require('csv-streamify');
var JSONStream = require('JSONStream');

var fdfFile = process.argv[3];
fs.readFile(fdfFile, function(err, data){
	if (err) throw err;
	
	var text = data.toString();
	var arr = text.split('\r\n');
	var lengths = [];
	var decimals = [];
	for(var i = 0; i < arr.length; i++) {
		if (arr[i].search('Length') >= 0) {
			lengths.push(arr[i].substring(7));
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
	parser.header = null;
	parser._rawHeader = [];
	parser._transform = function(data, encoding, done) {
			for(var i = 0; i < data.length; i++) {
				data[i] = data[i].replace(/,/g, '');
				// console.log(lengths[i] + ' - ' + data[i].length + ' = ' + whitespace);
				// if( !isNaN(parseFloat(data[i])) ) {
				// 	data[i] = parseFloat(data[i]);
				// } else {
				if (data[i] == 'A001169415'){
					data[i] = 'B001169415';
				}
				//remove whitespace in strings
				data[i] = data[i].replace(/ /g,'');
				// }

				if (decimals[i] > 0) {
					var decimalPart = parseFloat(data[i]) - parseInt(data[i]);
					// if no decimal places when there should be add . and 0s
					if(decimalPart === 0) {
						var decimalString = '.' + new Array(decimals[i] + 1).join('0');
						data[i] += decimalString;
					} else {
						var addZeros = decimals[i] - data[i].substring(data[i].indexOf('.') + 1).length;
						data[i] += new Array(addZeros + 1).join('0');
					}
				}
				// console.log('data: ' + data[i]);
				// console.log('length: ' + lengths[i]);
				var whitespace = lengths[i] - data[i].length;
				if (i === data.length - 1){
					whitespace++;
				};
				
				// console.log('ws: ' + whitespace);
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