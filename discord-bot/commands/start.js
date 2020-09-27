const Lobby = require('../../classes/Lobby');
const { ReplyError, requireVoiceChannel, parseRoomCode, getLobbyInfoEmbed } = require('./_helpers');

const greeting = require('../sounds')('hello');

module.exports = async function startCommand(message, arguments) {
    const channel = await requireVoiceChannel(message);

    // Check if there's already a lobby in that channel.
    let lobby = await Lobby.find(channel);
    if (lobby) throw new ReplyError("I've already got a lobby in that channel.");

    // Start a new lobby;
    lobby = await Lobby.start(channel);

    // If a room code was provided, handle it.
    parseRoomCode(lobby, arguments);

    // Send lobby info to the channel.
    await message.channel.send(getLobbyInfoEmbed(lobby, {title: "New Lobby!"}))

    // Join the channel, if possible.
    if (channel.joinable && channel.speakable) {
        const voiceConnection = await channel.join();
        voiceConnection.setSpeaking(0);
        voiceConnection.play(greeting);
    }
    else {
        await message.reply("I can't speak in your channel, but I'll run a lobby for it anyway.")
    }

};