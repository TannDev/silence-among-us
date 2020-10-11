const { version = 'Unreleased' } = require('../../package.json');
const { getGuildCount } = require('../discord-bot');

module.exports = async function versionCommand(message) {
    const guildCount = await getGuildCount();
    return message.reply(`I'm on version ${version} and support ${guildCount} guilds.`);
};