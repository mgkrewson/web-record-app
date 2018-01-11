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
    id = "",
    setDate() {
        const date = new Date();
        this.date = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear()
        return this;
    },
    audioTitle,
    age,
    gender,
    location,
    email,
    audio_url = "",
    pic_url = "",
    audioFilePath = audioFilePath,
    picFilePath = 'temp/output',
    setPic(picfile) {
        this.picExt = this.picFile.originalname.slice(picFile.originalname.lastIndexOf('.'), picFile.originalname.length);
        this.picType = this.picFile.mimetype;
        return this;
    }
});

module.exports = {createEntry};