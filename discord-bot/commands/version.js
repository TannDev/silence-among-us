const { info: { version } } = require('../../lib/loadSchema');

module.exports = async function versionCommand(message) {
    return message.reply(`I'm on version ${version}`);
};