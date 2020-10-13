const Command = require('.');
const { MessageEmbed } = require('discord.js');
const Lobby = require('../../classes/Lobby');
const Room = require('../../classes/Room');

// Get server information.
const { url, host, secure } = require('../../lib/server');
const { capture } = require('../../downloads');

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
        const captureVersion = capture.publicRelease ? `v${capture.version}` : `${capture.version} Prerelease`;
        const versionLink = `${captureVersion} ([Download](${url}/api/capture/download))`;

        // Give the user a connect code.
        const dmChannel = await message.author.createDM();
        await dmChannel.send(new MessageEmbed()
            .setTitle("You've started a new game lobby!")
            .setDescription([
                `You've created a new lobby using the **${voiceChannel.name}** channel in **${voiceChannel.guild.name}**.`,
                `Lobby status and updates will be posted in <#${textChannel.id}>.\n`,
                `You can automate the lobby using [Among Us Capture](https://github.com/denverquane/amonguscapture).`,
                `If you don't already have the right version, download it securely from the link below.`
            ].join('\n'))
            .addField('Compatible Version', versionLink, true)
            .addField('Bot URL', `\`${url}\``, true)
            .addField('Connect Code', `\`${connectCode}\``, true)
            .addField('One-Click Connect Link', captureLink)
        );

        // Join the channel, if possible.
        // TODO Move the speaking into the Lobby class.
        if (voiceChannel.joinable && voiceChannel.speakable) {
            // const voiceConnection = await voiceChannel.join();
            // voiceConnection.setSpeaking(0);
            // voiceConnection.play(greeting);
        }
        else {
            await message.reply("I can't speak in your channel, but I'll run a lobby for it anyway.");
        }
    }
});