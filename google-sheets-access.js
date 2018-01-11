const google = require('googleapis');
const sheets = google.sheets('v4');
const googleAuth = require('google-auth-library');
var TOKEN_PATH = __dirname + '/.credentials/sheets.googleapis.com-nodejs-quickstart.json';
var Promise = require("bluebird");
const fs = Promise.promisifyAll(require("fs"));


/* get Google Sheets creds */
let creds;
fs.readFileAsync(TOKEN_PATH)
    .then((token) => {
        creds = JSON.parse(token);
        console.log("got credentials");
    });

function getClientSecret() {
    return fs.readFileAsync('client_secret.json');
}

function returnClient(content) {

    credentials = JSON.parse(content);
    clientSecret = credentials.installed.client_secret;
    clientId = credentials.installed.client_id;
    redirectUrl = credentials.installed.redirect_uris[0];
    auth = new googleAuth();
    oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
    oauth2Client.credentials = creds;

    return oauth2Client;
}

function getQuery(authClient, range) {
    console.log("accessSheets called");

    var request = {
        spreadsheetId: '13qJXcfrmwcfP8bzlHQxAkJo0_2QdvuG9X1bCfwvvMO8',
        range: range,
        auth: authClient
    };

    return Promise.promisify(sheets.spreadsheets.values.get)(request);

}

function getRange(range) {
    return getClientSecret()
        .then((content) => {
            let client = returnClient(content);
            return getQuery(client, range);
        })
        .then((response) => {
            return response;
        })
        .catch((err) => {console.error});
}

function uploadQuery(client, range, data) {
    var request = {
        spreadsheetId: '13qJXcfrmwcfP8bzlHQxAkJo0_2QdvuG9X1bCfwvvMO8',
        range: range,
        insertDataOption: "INSERT_ROWS",
        valueInputOption: "USER_ENTERED",
        resource: {
            values: data
        },
        auth: authClient,
    };
    return Promise.promisify(sheets.spreadsheets.values.append)(request);
}

function saveNewEntry(entry) {
    console.log("saveNewEntry is called");
    const data = [
        [
            "'" + entry.id,
            entry.date,
            entry.title,
            entry.age,
            entry.gender,
            entry.location,
            entry.email,
            entry.audio_url,
            entry.pic_url,
        ]
    ];
    const range = 'A2:I2';

    console.log("Sent to Sheets: " + JSON.stringify(data));

    return getClientSecret()
        .then((content) => {
            let client = returnClient(content);
            return uploadQuery(client, range, data);
        })
        .then((response) => {
            console.log(response);
        })
        .catch((err) => {console.error});
}


module.exports = {
    saveNewEntry,
    getRange
};