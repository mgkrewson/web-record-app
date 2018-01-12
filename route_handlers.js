const sharp = require('sharp');
const path = require('path');
var Promise = require("bluebird");
const fs = Promise.promisifyAll(require("fs"));
const gcsStorage = require('./google-cloud-access.js');
const gSheets = require('./google-sheets-access.js');
const createEntry = require('./create-entry.js');


function getRandomID() {
    return gSheets.getRange("A2:A")
        .then((response) => {
            let length = response.values.length;
            let randInd = Math.floor(Math.random() * length);
            return response.values[randInd];
        })
        .catch((err) => {
            console.error;
        });
}

function getNewID(response) {
    let len = response.values.length;
    let lastRecord = Number.parseInt(response.values.sort()[len - 1]);
    console.log('last id: ' + lastRecord);
    id = addZeros(lastRecord + 1);
    console.log('new id: ' + id);
    return id;
}

function addZeros(int) {
    let str = int.toString();
    while (str.length < 5) {
        str = "0" + str;
    }
    return str;
}

function deleteTempFiles() {
    return fs.readdirAsync('temp/')
        .then((files) => {
            for (const file of files) {
                fs.unlinkAsync(path.join('temp/', file))
                    .then((err) => console.error);
            }
        })
        .catch((err) => console.error);
}

function postRandom(req, res) {
    console.log("got POST random request");
    getRandomID()
        .then((id) => {
            console.log(id[0]);
            res.end(id[0]);
        });
}

function getPlay(req, res) {
    if (!req.query.id) {
        getRandomID()
            .then((id) => {
                console.log({
                    id
                });
                res.redirect('/play?id=' + id);
            })
            .catch((err) => {
                console.error
            });
    } else {
        gSheets.getRange("A2:A")
            .then((response) => {
                const requestedID = req.query.id;
                const row = response.values.map((val) => val.toString()).indexOf(requestedID) + 2;
                console.log({
                    row
                });
                let range = 'A' + row + ':I' + row;
                return gSheets.getRange(range)
            })
            .then((response) => {
                let context = {
                    // 'id': requestedID,
                    'audioTitle': response.values[0][2],
                    'title': " - PLAY",
                    'age': response.values[0][3],
                    'gender': response.values[0][4],
                    'location': response.values[0][5],
                    'audio_url': response.values[0][7],
                    'pic_url': response.values[0][8]
                };
                console.log(context);
                res.render('pages/play', context);
            })
    }
}

function recordPost(req, res, next) {
    console.log("POST request received");

    let entry = createEntry.createEntry({
        audioTitle: req.body.title,
        age: req.body.age,
        gender: req.body.gender,
        location: req.body.location,
        email: req.body.email,
        audioFilePath: req.files['audio_file'][0].path
    });
    entry.setDate();
    entry.setPic(req.files['pic'][0]);
    console.log(entry);

    gSheets.getRange("A2:A")
        .then((response) => {
            let id = getNewID(response);
            entry.setID(id);
            return sharp(entry.picOriginalPath)
                .max(1200, 1400)
                .toFile('temp/output' + entry.picExt)
                .then((info) => {
                    console.log(info);
                })
        })
        .then(() => {
            return gcsStorage.uploadFiles(entry);
        })
        .then((entry) => {
            return gSheets.saveNewEntry(entry);
        })
        .then(() => {
            res.end(entry.id);
            return deleteTempFiles();
        })
        .catch((err) => {
            console.error(err);
        });
}



module.exports = {
    getPlay,
    postRandom,
    recordPost
};