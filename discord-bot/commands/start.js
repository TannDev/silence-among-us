const Lobby = require('../../classes/Lobby');
const { ReplyError, requireTextChannel, requireVoiceChannel, parseRoomCode } = require('./_helpers');

const greeting = require('../sounds')('hello');

module.exports = async function startCommand(message, arguments) {
    const textChannel = await requireTextChannel(message);
    const voiceChannel = await requireVoiceChannel(message);

    // Check if there's already a lobby in that channel.
    let lobby = await Lobby.find(voiceChannel);
    if (lobby) throw new ReplyError("I've already got a lobby in that channel.");

    // If a room code was provided, handle it.
    const room = parseRoomCode(arguments);

    // Start a new lobby;
    lobby = await Lobby.start(voiceChannel, textChannel, room);

    // Send lobby info to the channel.
    await lobby.postLobbyInfo()

    // Join the channel, if possible.
    // TODO Move the speaking into the Lobby class.
    if (voiceChannel.joinable && voiceChannel.speakable) {
        const voiceConnection = await voiceChannel.join();
        voiceConnection.setSpeaking(0);
        // voiceConnection.play(greeting);
    }
    else {
        await message.reply("I can't speak in your channel, but I'll run a lobby for it anyway.")
    }
};