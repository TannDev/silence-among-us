const Command = require('.');
const { MessageEmbed } = require('discord.js');
const Lobby = require('../../classes/Lobby');
const Room = require('../../classes/Room');

// Get server information.
const { url, host, secure } = require('../../lib/server');

module.exports = new Command({
    aliases: ['start'],
    options: '[room code] [na|eu|asia]',
    description: 'Start a new lobby.',
    category: 'core',
    handler: async function() {
        // Load properties from the command context.
        const { message, arguments } = this;
        const textChannel = await this.requireTextChannel();
        const voiceChannel = await this.requireVoiceChannel();

        // Get the room, if any.
        const [code, region] = arguments.split(/\s+/g);
        const room = code && new Room({ code, region });

        // Start a new lobby;
        const lobby = await Lobby.start(voiceChannel, textChannel, room);

        // Generate capture information.
        const { connectCode } = lobby;
        const captureLink = `<aucapture://${host}/${connectCode}${secure ? '' : '?insecure'}>`;
        const captureRepo = 'https://github.com/denverquane/amonguscapture'
        const captureVersion = `2.4.2`; // TODO Externalize this again.
        const captureDownload = `${captureRepo}/releases/download/${captureVersion}/AmongUsCapture.exe`;
        const versionLink = `${captureVersion} ([Download](${captureDownload}))`;

        // Give the user a connect code.
        const dmChannel = await message.author.createDM();
        await dmChannel.send(new MessageEmbed()
            .setTitle("You've started a new game lobby!")
            .setDescription([
                `You've created a new lobby using the **${voiceChannel.name}** channel in **${voiceChannel.guild.name}**.`,
                `Lobby status and updates will be posted in <#${textChannel.id}>.\n`,
                `You can automate the lobby using [Among Us Capture](https://github.com/denverquane/amonguscapture).`,
                `If you don't already have the right version, download it from the link below.`
            ].join('\n'))
            .addField('Compatible Version', versionLink, true)
            .addField('Bot URL', `\`${url}\``, true)
            .addField('Connect Code', `\`${connectCode}\``, true)
            .addField('One-Click Connect Link', captureLink)
        );
    }
});
