install node

1. Parser.js sql CSV format to iSeries format converter
	a) using FDF file from the file that you eventually want to upload to
		(FDF files are badly formatted for reading so open in word, save as a text file, open in notepad and
		then replace all blank spaces with nothing)
	b) save data csv file from sql
	c) install dependencies:
		npm install csv-streamify
		npm install JSONStream
	d) run cat filename.csv | node parser.js filename2.csv filename.txt
	d) open csv file in text editor, replace all " and \r
	e) upload to iSeries
	