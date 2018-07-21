var fs = require('fs');
const {google} = require('googleapis');
const OAuth2 = google.auth.OAuth2;
const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
var cors = require('cors')

const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(bodyParser.json({limit: '50mb', extended: true})); 
app.use(bodyParser.urlencoded({limit: '50mb', extended: true }));


const clientSecret = "7lLch73zik-VsKukeCjuE7e_";
const clientId = "1006608561720-8jtfmfalcgtu8duncn2o5b08ekordhcg.apps.googleusercontent.com";
const redirectUrl = "https://my18-api.firebaseapp.com/auth";

var des;
var title;
var privacy;
var _public;
var video;
var id;
var access_token;
var result;

function getNewToken(code, callback) {
	console.log(code)
	var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
	console.log("access_token", access_token)
	if(access_token){
		console.log(' Already getnewtoken' , access_token);
		callback(access_token);
		return;
	}	
	oauth2Client.getToken(code, function(err, token) {
		if (err) {
			console.log(err)
		    result = 'Error while trying to retrieve access token ' + err;
		    return;
		}	
		console.log('getnewtoken' , token)
		access_token = token
		callback(token);
		
    });
}


app.post('/upload', (req, res) => {

	let code = req.body.code;
	des = req.body.des;
	title = req.body.title;
	privacy = req.body.private;
	_public = req.body.public;
	video = req.body.video

	// let video = videoString.split('video/*;base64,').pop();
	getNewToken(code,insert);
	var interval = setInterval(doStuff, 2000); // 2000 ms = start after 2sec 
	function doStuff() {
	  if(result !== undefined){
	  	let sendResponse = result;
		result = undefined;
		clearInterval(interval);
	  	res.send(sendResponse)
	  }
	}
})

app.post('/update', (req, res) => {

	let code = req.body.code;
	des = req.body.des;
	title = req.body.title;
	privacy = req.body.private;
	id = req.body.id;

	getNewToken(code, videosUpdate);
	
	var interval = setInterval(doStuff, 2000); // 2000 ms = start after 2sec 
	function doStuff() {
	  if(result !== undefined){
	  	let sendResponse = result;
		result = undefined
		clearInterval(interval);
	  	res.send(sendResponse)
	  }
	}
})

app.get('/videos',(req, res) => {

	let code = req.query.code;
	console.log(code)
	getNewToken(code, videoList);

	var interval = setInterval(doStuff, 2000); // 2000 ms = start after 2sec 
	function doStuff() {
	  if(result !== undefined){
	  	let sendResponse = result;
		result = undefined;
		clearInterval(interval)
	  	res.send(sendResponse)
	  }
	}
})


function removeEmptyParameters(params) {
  for (var p in params) {
    if (!params[p] || params[p] == 'undefined') {
      delete params[p];
    }
  }
  return params;
}


function createResource(properties) {
  var resource = {};
  var normalizedProps = properties;
  for (var p in properties) {
    var value = properties[p];
    if (p && p.substr(-2, 2) == '[]') {
      var adjustedName = p.replace('[]', '');
      if (value) {
        normalizedProps[adjustedName] = value.split(',');
      }
      delete normalizedProps[p];
    }
  }
  for (var p in normalizedProps) {
    if (normalizedProps.hasOwnProperty(p) && normalizedProps[p]) {
      var propArray = p.split('.');
      var ref = resource;
      for (var pa = 0; pa < propArray.length; pa++) {
        var key = propArray[pa];
        if (pa == propArray.length - 1) {
          ref[key] = normalizedProps[p];
        } else {
          ref = ref[key] = ref[key] || {};
        }
      }
    };
  }
  return resource;
}


function insert(token){
	console.log("inside insert")
	var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
	oauth2Client.credentials = token;
	var requestData = {
						   'params': {'part': 'snippet,status'}, 
		                   'properties': { 'snippet.categoryId': '22',
		                                   'snippet.defaultLanguage': '',
		                                   'snippet.description': des,
		                                   'snippet.tags[]': '',
		                                   'snippet.title': title,
		                                   'status.embeddable': '',
		                                   'status.license': '',
		                                   'status.privacyStatus': privacy,
		                                   'status.publicStatsViewable': _public
		                                  }, 
		                   'mediaFilename': video
                  	  }
    var service = google.youtube('v3');
	var parameters = removeEmptyParameters(requestData['params']);
	parameters['auth'] = oauth2Client;
	parameters['media'] = { body: requestData['mediaFilename'] };
	parameters['notifySubscribers'] = false;
	parameters['resource'] = createResource(requestData['properties']);
	var req = service.videos.insert(parameters, function(err, data) {
		console.log("req")
		if (err) {
			console.log(err)
		  result = 'The API returned an error: ' + err;
		}
		if (data) {
			console.log(data.data)
		  result = "Video Uploaded !!";
		}
		process.exit();
	});              	  
}

function videosUpdate(token) {
  var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
	oauth2Client.credentials = token;
  var requestData = {
						   'params': {'part': 'snippet,status'}, 
						   'properties': {
						   	                 'id': id,
                 						  	 'snippet.categoryId': '22',
							                 'snippet.defaultLanguage': '',
							                 'snippet.description': des,
							                 'snippet.tags[]': '',
							                 'snippet.title': title,
							                 'status.privacyStatus': privacy
      									 }
                   }	

  var service = google.youtube('v3');
  var parameters = removeEmptyParameters(requestData['params']);
  parameters['auth'] = oauth2Client;
  parameters['resource'] = createResource(requestData['properties']);
  service.videos.update(parameters, function(err, response) {
    if (err) {
      result = 'The API returned an error: ' + err;
      return;
    }
    result = "Video Updated";
  });
}

function videoList(token){
	request({ 
		url : `https://www.googleapis.com/youtube/v3/search?access_token=${token.access_token}&type=video&part=snippet&forMine=true`,
		json:true
	}, (error, response, body) => {
        if(error){
            result = error;
        }  
        else  
        	result = body;
    });
}


app.listen(port , () => {
    console.log(`Server is up on port ${port}`);
});











