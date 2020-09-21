const Lobby = require('../../classes/Lobby');
const { ReplyError, requireVoiceChannel } = require('./helpers');

const greeting = require('../sounds')('hello');

module.exports = async function joinCommand(message) {
    // Make sure the user is in a channel, and we have access.
    const channel = await requireVoiceChannel(message);

    // See if we already have a voice connection to that channel.


    // Check if there's already a lobby in that channel.\
    let lobby = await Lobby.find(channel.id);
    if (lobby) {
        // TODO Double check the lobby's voice connection.
        await message.reply("I've already got a lobby in that channel.");
        await lobby.voiceConnection.play(greeting);
    }
    else {
        if (!channel.joinable) throw new ReplyError("I don't have access to the voice channel that you're in.");
        const voiceConnection = await channel.join();
        voiceConnection.setSpeaking(0);
        voiceConnection.play(greeting);
        new Lobby(voiceConnection);
        await message.reply("Alright, let's play!");
    }
};