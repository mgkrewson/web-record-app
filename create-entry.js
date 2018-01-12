// Factory for new entries
const createEntry = ({
    audioTitle,
    age,
    gender,
    location,
    email,
    picfile,
    audioFilePath
}) => ({
    audioTitle,
    age,
    gender,
    location,
    email,
    audioFilePath,
    setID(id) {
        this.id = id;
    },
    setDate() {
        const date = new Date();
        this.date = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
        return this;
    },
    setAudioUrl(audio_url) {
        this.audio_url = audio_url;
    },
    setPicUrl(pic_url) {
        this.pic_url = pic_url;
    },
    setPic(picfile) {
        this.picExt = picfile.originalname.slice(picfile.originalname.lastIndexOf('.'), picfile.originalname.length);
        this.picType = picfile.mimetype;
        this.picFilePath = 'temp/output' + this.picExt;
        this.picOriginalPath = picfile.path;
        return this;
    }
});

module.exports = {createEntry};