var portNum = 8078;

var request = require('request');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

// An object that gets stringified and sent to the API in the
// body of an HTTP request
var requestObject = {
  "requests": [{
    "image": {
      "source": {
        "imageUri": ""
      }
    },
    "features": [{
      "type": "LABEL_DETECTION"
    }]
  }]
}


// URL containing the API key
url = 'https://vision.googleapis.com/v1/images:annotate?key=AIzaSyCE5GB9FIFt0a_a_fQpMWn6AQuHOxTskhU';

module.exports = {

   annotateImage : function (fileName,completionHandler) {
    // The code that makes a request to the API
    // Uses the Node request module, which packs up and sends off
    // an XMLHttpRequest.

    var jsonObj = JSON.parse(JSON.stringify(requestObject));

    jsonObj.requests[0].image.source.imageUri = 'http://138.68.25.50:'+portNum+'/assets/' + fileName;

    console.log(jsonObj.requests[0].image.source.imageUri);


    request({ // HTTP header stuff
        url: url,
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        // stringifies object and puts into HTTP request body as JSON
        json: jsonObj,
      },
      // callback function for API request
      APIcallback
    );

    // live callback function
    function APIcallback(err, APIresponse, body) {
      if ((err) || (APIresponse.statusCode != 200)) {
        console.log("Got API error",APIresponse.statusCode);
      } else {
        console.log(body.responses[0]);
        APIresponseJSON = body.responses[0];
        var jsonObj = JSON.parse(JSON.stringify(APIresponseJSON));

        var labelArr = jsonObj.labelAnnotations;


        var labels =labelArr[0].description

        for (var i = 1 ; i < labelArr.length ; i++){
          labels += ";" + labelArr[i].description
        }

          console.log(labelArr[i]);
          var query = "http://138.68.25.50:"+portNum+"/query?op=add&img=" + fileName + "&label=" +labels;
          request({ // HTTP header stuff
              url: query,
              method: "GET"
              // stringifies object and puts into HTTP request body as JSON
            },
            completionHandler(labels)
          );



      }
    }

  }
};
