const Lobby = require('../../classes/Lobby');
const { requireVoiceChannel } = require('./_helpers');

module.exports = async function leaveCommand(message) {
    // Make sure the user is in a channel, and we have access.
    const channel = await requireVoiceChannel(message);

    // Check if there's a lobby in that channel.
    let lobby = await Lobby.find(channel.id);

    // Leave the channel, no matter what.
    channel.leave();

    // Respond appropriately.
    if (lobby) await message.reply("Let's play again soon, okay?");
    else message.reply("I'm not in your channel.")
};