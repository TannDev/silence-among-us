const path = require('path');
const version = '2.3.1'
const publicRelease = Boolean(version.match(/^\d+\.\d+\.\d+$/));
const filepath = path.resolve(__dirname, `AmongUsCapture-${version}.exe`);
const filename = `AmongUsCapture-${version}.exe`;

module.exports = {publicRelease, version, filepath, filename}