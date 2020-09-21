const path = require('path');

module.exports = function getSoundPath(sound) {
    return path.join(__dirname, `${sound}.mp3`);
}