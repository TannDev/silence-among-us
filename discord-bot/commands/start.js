const Lobby = require('../../classes/Lobby');
const { ReplyError, requireVoiceChannel } = require('./_helpers');

const greeting = require('../sounds')('hello');

module.exports = async function startCommand(message, arguments) {
    // Make sure the user is in a channel, and we have access.
    const channel = await requireVoiceChannel(message);

    // Check if there's already a lobby in that channel.
    let lobby = await Lobby.find(channel.id);
    if (lobby && !arguments.includes('--force')) {
        throw new ReplyError("I've already got a lobby in that channel. Use `start --force` if it's not working.");
    }

    await Lobby.start(channel.id);
    await message.reply(`Created a lobby for channel ${channel.id}`);

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