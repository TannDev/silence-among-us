const path = require('path');

module.exports = function getSoundPath(sound) {
    if (!sound || typeof sound !== 'string') throw new Error("Sound must be a string.");
    return path.join(__dirname, `${sound.toLowerCase()}.mp3`);
}