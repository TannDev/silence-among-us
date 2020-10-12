const { Command } = require('.');
const { MessageEmbed } = require('discord.js');
const { getGuildCount } = require('../discord-bot');
const { version = 'is unreleased' } = require('../../package.json');
const { url } = require('../../lib/server');
const Lobby = require('../../classes/Lobby');

module.exports = new Command(['stats', 'version', 'v'], async (message) => {
    const [guildsSupported, lobbiesInProgress] = await Promise.all([getGuildCount(), Lobby.getLobbyCount()]);

    const embed = new MessageEmbed()
        .setTitle('Silence Among Us')
        .setURL('https://github.com/tanndev/silence-among-us#silence-among-us')
        .setDescription([
            `**Version ${version}**`,
            `${guildsSupported} guilds supported`,
            `${lobbiesInProgress} lobbies in progress`
        ].join('\n'))
        .addField('API Server', url);

    return message.channel.send(embed);
});