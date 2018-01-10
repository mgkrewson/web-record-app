// import { content } from "googleapis/apis";

// import { error } from "util";

var Promise = require("bluebird");
const fs = Promise.promisifyAll(require("fs"));
const express = require('express');
const multer = require('multer');
var bodyParser = require('body-parser');
var upload = multer({
    dest: 'temp/'
});
var urlencodedParser = bodyParser.urlencoded({
    extended: false
});

const app = express();
const google = require('googleapis');
const sheets = google.sheets('v4');
const googleAuth = require('google-auth-library');

//const { body,validationResult } = require('express-validator/check');
//const { sanitizeBody } = require('express-validator/filter');

var SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
var TOKEN_DIR = __dirname + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'sheets.googleapis.com-nodejs-quickstart.json';


const hostname = '127.0.0.1';
const listenPort = 3000;

const server = app.listen(listenPort, hostname, function () {
    let host = server.address().address;
    let port = server.address().port;
    console.log('Server running at http://%s:%s/', host, port);
});

// initialize state
let state = {
    currentForm: {},
};
let creds;
fs.readFileAsync(TOKEN_PATH)
    .then((token) => {
        creds = JSON.parse(token);
        console.log("got credentials");
    });



app.use(express.static('public'));
app.use(express.static('bower_components'));
app.use(bodyParser.json())
app.set('view engine', 'ejs');
app.use(function (err, req, res, next) {
    // handle error
    console.error(err);
});



app.get('/', function (req, res) {
    res.render('pages/index', {
        title: '',
    });
});

app.get('/record', function (req, res) {
    res.render('pages/record', {
        title: ' - RECORD',
    });
});

app.get('/thanks', function (req, res) {
    res.render('pages/thanks', {
        title: ' - THANKS',
    });
});

app.get('/play', function (req, res) {
    if (!req.query.id) {
        getRandomID()
            .then((randomID) => {
                console.log({
                    randomID
                });
                res.redirect('/play?id=' + randomID);
            })
            .catch((err) => {
                console.error
            });
    } else {
        res.render('pages/play', {
            'title': ' - PLAY'
        });
    }
});

let count = 0;
app.post('/random', function(req, res, next) {
    console.log("got random POST request");
    if (count >= 4) {
        res.end();
    }
    count++;
    getRandomID()
    .then((id) => {
        console.log(id[0]);
        res.end(id[0]);
        // res.end(id);
    });
});

function getRandomID() {
    return fs.readFileAsync('client_secret.json')
        .then(content => {
            return returnClient(content)
        })
        .catch((error) => console.error)
        .then((authClient) => {
            return accessSheets(authClient, 'A2:A');
        })
        .then((response) => {
            let length = response.values.length;
            let randInd = Math.floor(Math.random() * length);
            return response.values[randInd];
        })
        .catch((err) => {
            console.error;
        })
}

var fileFields = upload.fields([{
    name: 'audio_file',
    maxCount: 1
}, {
    name: 'pic',
    maxCount: 1
}]);
app.post('/record_post', fileFields, function (req, res, next) {
    console.log("POST request received");
    // perform some data validation

    console.log(req.files['audio_file'][0].path);
    console.log(req.files['pic'][0].path);

    // save data to state
    var date = new Date();
    state.currentForm = req.body;
    state.currentForm.date = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
    console.log("current state: " + JSON.stringify(state.currentForm));

    fs.readFileAsync('client_secret.json')
        .then(content => {
            return returnClient(content)
        })
        .catch((error) => console.error)
        .then((authClient) => {
            return accessSheets(authClient, 'A2:A');
        })
        .then((response) => {
            return getID(response);
        })
        .then((id) => {
            const audioFilePath = req.files['audio_file'][0].path;
            const picFile = req.files['pic'][0];
            const picFilePath = picFile.path;
            const picExt = picFile.originalname.slice(picFile.originalname.lastIndexOf('.'), picFile.originalname.length);
            const picType = picFile.mimetype;


            return uploadFile(id, audioFilePath, picFilePath, picType, picExt);
        })
        .catch((err) => {
            console.error(err);
        });

    res.end();

});

app.post('/play_post', urlencodedParser, function (req, res, next) {
    console.log("POST request received");
    console.log(req.body.id);

    let requestedID = req.body.id;
    let row;
    let context = {};

    //get spreadsheet data for id
    fs.readFileAsync('client_secret.json')
        .then(content => {
            return returnClient(content)
        })
        .then((authClient) => {
            return accessSheets(authClient, 'A2:A');
        })
        .then((response) => {
            row = response.values.map((val) => val.toString()).indexOf(requestedID) + 2;
            console.log({
                row
            });
            return fs.readFileAsync('client_secret.json')
        })
        .then(content => {
            return returnClient(content)
        })
        .then((authClient) => {
            return accessSheets(authClient, 'A' + row + ':H' + row);
        })
        .then((response) => {
            context = {
                'id': requestedID,
                'audioTitle': response.values[0][0],
                'age': response.values[0][2],
                'gender': response.values[0][3],
                'location': response.values[0][4],
                'audio_url': response.values[0][6],
                'pic_url': response.values[0][7]
            };
            console.log(context);
            res.write(JSON.stringify(context));
            res.end();
        });

});

function returnClient(content) {
    console.log("first file opened");
    // Authorize a client with the loaded credentials, then call the
    // Google Sheets API.

    credentials = JSON.parse(content);
    clientSecret = credentials.installed.client_secret;
    clientId = credentials.installed.client_id;
    redirectUrl = credentials.installed.redirect_uris[0];
    auth = new googleAuth();
    oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
    oauth2Client.credentials = creds;

    return oauth2Client;
}

function accessSheets(authClient, range) {
    console.log("accessSheets called");

    var request = {
        spreadsheetId: '13qJXcfrmwcfP8bzlHQxAkJo0_2QdvuG9X1bCfwvvMO8',
        range: range,
        auth: authClient
    };

    return Promise.promisify(sheets.spreadsheets.values.get)(request);

}

function getID(response) {
    let len = response.values.length;
    let lastRecord = Number.parseInt(response.values.sort()[len - 1]);
    console.log('last id: ' + lastRecord);
    state.currentForm.id = addZeros(lastRecord + 1);
    console.log('new id: ' + state.currentForm.id);
    return state.currentForm.id;
}

function addZeros(int) {
    let str = int.toString();
    while (str.length < 5) {
        str = "0" + str;
    }
    return str;
}


function saveNewEntry(authClient) {
    console.log("saveNewEntry is called");
    const data = [
        [
            "'" + state.currentForm.id,
            state.currentForm.date,
            state.currentForm.age,
            state.currentForm.gender,
            state.currentForm.location,
            state.currentForm.email,
            state.currentForm.audio_url,
            state.currentForm.pic_url,
        ]
    ];

    console.log("Sent to Google: " + JSON.stringify(data));

    var request = {
        spreadsheetId: '13qJXcfrmwcfP8bzlHQxAkJo0_2QdvuG9X1bCfwvvMO8',
        range: 'A2:K2',
        insertDataOption: "INSERT_ROWS",
        valueInputOption: "USER_ENTERED",
        resource: {
            values: data
        },
        auth: authClient,
    };

    return Promise.promisify(sheets.spreadsheets.values.append)(request);

}




function uploadFile(id, audioFile, picFile, picType, picExt) {
    // [START storage_upload_file]
    // Imports the Google Cloud client library

    console.log("uploadFile is called");
    console.log(arguments);

    const Storage = require('@google-cloud/storage');
    const storage = new Storage();
    var bucketName = 'web-record-5f7ce.appspot.com';
    var bucket = storage.bucket(bucketName);

    var audioOptions = {
        destination: '/audio_uploads/' + id + '.oga',
        metadata: {
            contentType: 'audio/ogg',
        }
    };

    //let extension = picFile.substring(picFile.lastIndexOf('.'), picFile.length);

    var picOptions = {
        destination: '/image_uploads/' + id + picExt,
        metadata: {
            contentType: picType,
        }
    };

    // Uploads a local file to the bucket
    return bucket
        .upload(audioFile, audioOptions)
        .then((file) => {
            console.log("audio upload successful");
            return file[0].makePublic();
        })
        .then((file) => {
            console.log("audio made public");

            state.currentForm.audio_url = "https://storage.googleapis.com/" + bucketName + audioOptions.destination;
            console.log("audio_url: " + state.currentForm.audio_url);
            return bucket.upload(picFile, picOptions);
        })
        .then((file) => {
            console.log("pic made public");
            return file[0].makePublic();
        })
        .then((file) => {
            console.log("pic upload successful; " + JSON.stringify(file[0]));
            state.currentForm.pic_url = "https://storage.googleapis.com/" + bucketName + picOptions.destination;
            console.log("image_url: " + state.currentForm.pic_url);
            return fs.readFileAsync('client_secret.json')
        })
        .then(content => {
            return returnClient(content)
        })
        .then((authClient) => {
            return saveNewEntry(authClient);
        })
        .then((response) => {
            console.log(JSON.stringify(response, null, 2));
        })
        .catch(err => {
            console.error('ERROR:', err);
        });
    // [END storage_upload_file]
}

function downloadFile(srcFilename, destFilename) {
    console.log("downloadFile is called");
    console.log(arguments);

    // [START storage_download_file]
    // Imports the Google Cloud client library
    const Storage = require('@google-cloud/storage');
    const storage = new Storage();

    var bucket = storage.bucket('web-record-5f7ce.appspot.com');


    /**
     * TODO(developer): Uncomment the following lines before running the sample.
     */

    // const srcFilename = 'Remote file to download, e.g. file.txt';
    // const destFilename = 'Local destination for file, e.g. ./local/path/to/file.txt';

    const options = {
        // The path to which the file should be downloaded, e.g. "./file.txt"
        destination: destFilename,
    };

    // Downloads the file
    return bucket
        .file(srcFilename)
        .download(options)
        .then(() => {
            console.log(
                srcFilename + ' downloaded'
            );
        })
        .catch(err => {
            console.error('ERROR:', err);
        });
    // [END storage_download_file]
}





/* const standardFileServeOptions = {
    dotfiles: 'deny',
    headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
    }
};

function standardFileServeErrorHandle(err, fileName, res) {
    if (err) {
        console.log(err);
        res.sendStatus(404);
    } else {
        console.log("Sent: ", fileName);
    }
} */

/* function serveFiles(req, res) {
    console.log("GET request for" + req.url);

    const fileName = req.url === "/" ? __dirname + "/index.html" : __dirname + req.url + ".html";
    res.sendFile(fileName, standardFileServeOptions, (err) => standardFileServeErrorHandle(err, fileName, res));
}

app.get('/*', (req, res) => serveFiles(req, res)); */


// export GOOGLE_APPLICATION_CREDENTIALS="/Users/michaelkrewson/Dropbox/Coding_projects/web_record/web-record-5f7ce-firebase-adminsdk-48kz4-39edebe7c0.json"