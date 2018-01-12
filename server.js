const express = require('express');
const app = express();
const multer = require('multer');
const upload = multer({
    dest: 'temp/'
});
const bodyParser = require('body-parser');
const handlers = require('./route_handlers.js');

const hostname = '127.0.0.1';
const listenPort = 3000;
const server = app.listen(listenPort, hostname, function () {
    let host = server.address().address;
    let port = server.address().port;
    console.log('Server running at http://%s:%s/', host, port);
});


/* Define Middleware */
app.use(express.static('public'));
app.use(express.static('bower_components'));
app.use(bodyParser.json())
app.set('view engine', 'ejs');
app.use(function (err, req, res, next) {
    console.error(err);
});
var urlencodedParser = bodyParser.urlencoded({
    extended: false
});
var fileFields = upload.fields([{
    name: 'audio_file',
    maxCount: 1
}, {
    name: 'pic',
    maxCount: 1
}]);


/* Define Routing */
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

app.get('/play', function (req, res, next) {
    handlers.getPlay(req, res);
});

app.post('/random', function (req, res, next) {
    handlers.postRandom(req, res, next);
});

app.post('/record_post', fileFields, function (req, res, next) {
    handlers.recordPost(req, res, next);
});

// app.post('/play_post', urlencodedParser, function (req, res, next) {
//     handlers.playPost(req, res, next);
// });




// export GOOGLE_APPLICATION_CREDENTIALS="/Users/michaelkrewson/Dropbox/Coding_projects/web_record/web-record-5f7ce-firebase-adminsdk-48kz4-39edebe7c0.json"