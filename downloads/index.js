const path = require('path');
const version = 'Reconnect-Beta';
const publicRelease = Boolean(version.match(/^\d+\.\d+\.\d+$/));
const filepath = path.resolve(__dirname, `AmongUsCapture-${version}.exe`);
const filename = `AmongUsCapture-${version}.exe`;

module.exports = { capture: { publicRelease, version, filepath, filename } };