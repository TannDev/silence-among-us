const Lobby = require('../../classes/Lobby');
const { ReplyError, requireVoiceChannel, parseRoomCode } = require('./_helpers');

const greeting = require('../sounds')('hello');

module.exports = async function startCommand(message, arguments) {
    const voiceChannel = await requireVoiceChannel(message);
    const textChannel = message.channel;

    // Check if there's already a lobby in that channel.
    let lobby = await Lobby.find(voiceChannel);
    if (lobby) throw new ReplyError("I've already got a lobby in that channel.");

    // Start a new lobby;
    lobby = await Lobby.start(voiceChannel, textChannel);

    // If a room code was provided, handle it.
    parseRoomCode(lobby, arguments);

    // Send lobby info to the channel.
    await lobby.postLobbyInfo({title: "New Lobby!"})

    // Join the channel, if possible.
    if (voiceChannel.joinable && voiceChannel.speakable) {
        const voiceConnection = await voiceChannel.join();
        voiceConnection.setSpeaking(0);
        voiceConnection.play(greeting);
    }
    else {
        await message.reply("I can't speak in your channel, but I'll run a lobby for it anyway.")
    }

};