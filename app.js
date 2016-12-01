givar fs = require('fs');

/*scraping - combination of both the request and cheerio module
I used a combination of the Request and Cheerio npm packages in order to scrape the
information I need from the site. The Request package allows for making simplified http requests
that could be passed to the cheerio package which uses a server side implementation of the core Jquery library
in order to easiily navigate through the data retrieved from the request to grab the information needed. Both packages
are regularly maintained and used by the community. Both packages are well documented in additon to many useful examples
of using these packages together to scrape information from websites to learn from.
*/
var request = require('request');
var cheerio = require('cheerio');

//csv - fast-csv
//reasons for use
  //frequently updated current version 2.3.0
  //frequently downloads
  //good documentation
//I have chosen to use the fast-csv package because of its regular updates (currently at version 2.3.0) and
//frequent use by the community. It also provides clear and easy to use documentation and examples
var csv = require('fast-csv');

var latestProducts = [];
var latestProductUrls = [];

request("http://www.shirts4mike.com", function(error, response, body) {

  if(error) {
    console.log("Error: Could not connect to http://www.shirts4mike.com");
    return;
  }

  //create the data directory if it doesnt already exist
  if(!pathExists("data")){
    fs.mkdirSync("data");
  }

  //remove csv file if file for current date already exists
  if(pathExists("data/"+getCurrentDate()+".csv")){
    fs.unlinkSync("data/"+getCurrentDate()+".csv");
  }

  var csvStream = csv.createWriteStream({headers:true})
  var writeableStream = fs.createWriteStream("data/"+getCurrentDate()+".csv");

  csvStream.pipe(writeableStream);
  csvStream.write(["Title","Price","ImageURL","URL","Time"]);

  var $ = cheerio.load(body);

  $('.products a').each(function(index){
    latestProductUrls.push($(this).attr('href'));
  });

  for(var i = 0; i < latestProductUrls.length; i++){
    getProductDetails(latestProductUrls[i],csvStream)
  }

});


//return the product at the specified product Url and write it to the csv file
function getProductDetails(productUrl,csvStream){
  request("http://www.shirts4mike.com/"+productUrl, function(error, response, body) {

    if(error) {
      console.log("Error: " + error);
    }

    var $ = cheerio.load(body);
    var product = {};
    product.title = $('.shirt-details h1').clone().children().remove().end().text(); //title
    product.price = $('.shirt-details span').text(); //price
    product.url = ('http://www.shirts4mike.com/'+productUrl); //productUrl
    product.image = "http://www.shirts4mike.com/" + $('.shirt-picture img').attr('src') //image url

    csvStream.write([product.title,product.price,product.url,product.image,getCurrentTime()]);
  });
}

//return current date in YYYY - M - D format
function getCurrentDate(){
  var date = new Date();
  return date.getFullYear() + "-" + parseInt(date.getMonth()+1) + "-" + date.getDate();
}

//return current time in 24hr format
function getCurrentTime(){
  var date = new Date();
  return date.getHours() + ": " + date.getMinutes();
}

//returns true if path specified is an existing directory or file path
function pathExists(path) {
  try {
    return fs.statSync(path).isDirectory() || fs.statSync(path).isFile();
  }
  catch (err) {
    return false;
  }
}
