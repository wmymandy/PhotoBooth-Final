
portNum = 8078;

/* use the express framwork */
var express = require("express");

//for parsing forms and reading in the images
var formidable = require('formidable');

var googleCV = require('./public/googleCV.js');

//making database
var sqlite3 = require("sqlite3").verbose(); // use sqlite
var dbFile = "photos.db";
var db = new sqlite3.Database(dbFile);
var cmdStr = "CREATE TABLE IF NOT EXISTS Photobooth (fileName TEXT UNIQUE NOT NULL PRIMARY KEY, labels TEXT, favorite INTEGER)"
db.run(cmdStr, errorCallback);


var app = express();

//static files
app.use(express.static('public'));

//queries
app.get('/query', function(request, response) {
  console.log("query");
  query = request.url.split("?")[1]; // get query string
  if (query) {
    answer(query, response);
  } else {
    sendCode(400, response, 'query not recognized');
  }
});

//upload images
app.post('/', function(request, response) {
  var form = new formidable.IncomingForm();
  var fileName = "";
  form.parse(request); // figures out what files are in form

  // callback for when a file begins to be processed
  form.on('fileBegin', function(name, file) {
    // put it in /public
    file.path = __dirname + '/public/assets/' + file.name;
    // file.path = __dirname + '/public/photobooth/' + file.name;
    fileName = file.name;
    console.log("uploading ", file.name, name);
  });

  // callback for when file is fully recieved
  form.on('end', function() {
    var db = new sqlite3.Database(dbFile);
    //1 for favorite and 0 for not favorite.
    var sqlQuery = [fileName, " ", "0"];
    console.log(sqlQuery);
    db.serialize(function() {
      db.run("INSERT INTO Photobooth VALUES  (? ,?, ?) ", sqlQuery, insertCallback);
    })
    db.close();

    function insertCallback(err){
      if (err) {
        response.status(500);
        response.send("Error");
        console.log("error :", err, "\n");
      }else{
        googleCV.annotateImage(fileName, function(labels) {
          response.status(201);
          response.send(labels);
        });
      }
    }
     // respond to browser
  });

});

app.get('/fetchPictures', function(req, res) {
  db.serialize(function() {
    db.all("SELECT * FROM Photobooth", getCallback);
  })

  function getCallback(err, rows) {
    if (err) {
      console.log(err);
    } else {
      res.send(rows);
    }

  }
});

function errorCallback(err) {
  if (err) {
    console.log("error :", err, "\n");
  }
}

// SERVER CODE
// Handle request to add a label
var querystring = require('querystring'); // handy for parsing query strings

function answer(query, response) {
  // query looks like: op=add&img=[image filename]&label=[label to add]
  //query looks like: op=remove&img=[image filename]&label=[label to delete]
  queryObj = querystring.parse(query);
  var label = queryObj.label;
  var imageFile = queryObj.img;
  console.log(imageFile);
  if (imageFile) {
    db.get('SELECT labels FROM Photobooth WHERE fileName = ?', [imageFile], getCallback);
  }

  function getCallback(err, data) {
    console.log("getting labels from " + imageFile);
    if (err) {
      console.log("error: ", err, "\n");
    }
    else {
      if (queryObj.op == "add") {
        var labelArr = data.labels.split(";");
        for (var i = 0; i < labelArr.length; i++) {
          if (labelArr[i] == label) {
            response.status(500);
            response.send("Repeated Label");
            return;
          }
        }
        db.run('UPDATE Photobooth SET labels = ? WHERE fileName = ?',
                 [data.labels + ";" + label, imageFile],
                 updateCallback);
      }
      else if (queryObj.op == 'remove') {
        db.run('UPDATE Photobooth SET labels = ? WHERE fileName = ?',
               [data.labels.replace(';' + label, ''), imageFile],
               updateCallback);
      }
      else if (queryObj.op == 'get') {
        response.status(200);
        response.send(data);
      }
    }
  }


  function updateCallback(err) {
    if (queryObj.op == "add") {
      console.log("updating labels for " + imageFile + "\n");
    }
    else if (queryObj.op == 'remove') {
      console.log("removing labels for " + imageFile + "\n");
    }
    if (err) {
      console.log(err + "\n");
      sendCode(400, response, "requested photo not found");
    } else {
      // send a nice response back to browser
      response.status(200);
      response.type("text/plain");
      if (queryObj.op == "add") {
        response.send("added label " + label + " to " + imageFile);
      }
      else if (queryObj.op == 'remove') {
        response.send("removed label " + label + " from " + imageFile);
      }
    }
  }
  //if query looks like var query = "/query?op=fav&img=" + imageName + "&favorite=" + [0,1];
  if(queryObj.op == "fav"){
	  	var isfav = queryObj.favorite;
	  	var imageName = queryObj.img;
	  	if(isfav && imageName){
	  		db.get(
	  			'SELECT favorite FROM Photobooth WHERE fileName = ?', [imageName], getFavoriteback);

	  		function getFavoriteback(err, data){
	  			console.log("getting is favorite from " + imageName);
	  			if(err){
	  				console.log("error: ", err, "\n");
	  			}else{
	  				db.run('UPDATE Photobooth SET favorite = ? WHERE fileName = ?', [isfav, imageName],
	            updateFavoriteback);
	  			}
	  		}

	  		function updateFavoriteback(err){
	  			console.log("updating labels for " + imageFile + "\n");
		        if (err) {
		          console.log(err + "\n");
		          sendCode(400, response, "requested photo not found");
		        } else {
		          // send a nice response back to browser
		          response.status(200);
		          response.type("text/plain");
		          response.send("add favorite " + isfav + " to " + imageName);
		        }
		  	}
	  	}
	}
}

app.listen(portNum);
