function uploadFiles(entry) {
    console.log("uploadFiles is called");

    // Import the Google Cloud client library
    const Storage = require('@google-cloud/storage');
    const storage = new Storage();


    // Set all options
    var bucketName = 'web-record-5f7ce.appspot.com';
    var bucket = storage.bucket(bucketName);

    var audioOptions = {
        destination: '/audio_uploads/' + entry.id + '.oga',
        metadata: {
            contentType: 'audio/ogg',
        }
    };

    var picOptions = {
        destination: '/image_uploads/' + entry.id + entry.picExt,
        metadata: {
            contentType: entry.picType,
        }
    };

    // Store URLs to Entry Object
    entry.audio_url = "https://storage.googleapis.com/" + bucketName + audioOptions.destination;
    state.currentEntry.pic_url = "https://storage.googleapis.com/" + bucketName + picOptions.destination;

    // Upload files to the bucket
    return bucket
        .upload(entry.audioFilePath, audioOptions)
        .then((file) => {
            console.log("audio upload successful");
            return file[0].makePublic();
        })
        .then((file) => {
            console.log("audio made public");
            return bucket.upload(entry.picFilePath, picOptions);
        })
        .then((file) => {
            console.log("pic upload successful");
            return file[0].makePublic();
        })
        .then((file) => {
            console.log("pic made public");
            return entry;
        })
        .catch(err => {
            console.error('ERROR:', err);
        });
}

module.exports = {uploadFiles};