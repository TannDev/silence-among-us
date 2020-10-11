const { MessageEmbed } = require('discord.js');
const Lobby = require('../../classes/Lobby');
const Room = require('../../classes/Room');
const { requireLobby, requireTextChannel, requireVoiceChannel } = require('./_helpers');

// Get server information.
const { url, host, secure } = require('../../lib/server');
const { capture } = require('../../downloads');

module.exports = async function lobbyCommand(message, arguments) {
    const [subcommand, code, region] = arguments.split(/\s+/g);

    // If there's no subcommand, just post lobby info.
    if (!subcommand) {
        const lobby = await requireLobby(message);
        await lobby.postLobbyInfo({force: true});
    }

    // If the subcommand is 'start', start a new lobby.
    else if (subcommand.match(/^start$/i)) {
        const textChannel = await requireTextChannel(message);
        const voiceChannel = await requireVoiceChannel(message);

        // Start a new lobby;
        const lobby = await Lobby.start(voiceChannel, textChannel, parseRoomCode(code, region));

        // Generate capture information.
        const captureLink = `<aucapture://${host}/${lobby.connectCode}${secure ? '' : '?insecure'}>`;
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
            .addField('Connect Capture App', captureLink, true)
            .addField('Compatible Version', versionLink, true)
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

    // If the subcommand is 'stop', stop the lobby.
    else if (subcommand.match(/^stop$/i)) {
        const lobby = await requireLobby(message);
        await lobby.stop();
        await message.reply("I've ended the lobby in your channel.\nLet's play again soon, okay?");
    }

    // If the subcommand is 'room' or 'r', update the room code.
    else if (subcommand.match(/^r(?:oom)?$/i)) {
        const lobby = await requireLobby(message);
        // If the "code" is an unlist instruction, delete it and return.
        if (code.match(/^unlist|remove|x$/i)) delete lobby.room;

        // Otherwise, parse it.
        else lobby.room = parseRoomCode(code, region);
        // TODO Handle room updates with a function.

        // Send lobby info to the channel.
        await lobby.postLobbyInfo();
    }

    else throw new Error(`Sorry, I don't have a lobby sub-command, \`${subcommand}\``);
};

/**
 * Parses a room code and region and returns a room.
 *
 * @param {string} code
 * @param {string} [region]
 * @return {Room}
 */
function parseRoomCode(code, region) {
    if (!code) return null;
    return new Room(code, region);
}