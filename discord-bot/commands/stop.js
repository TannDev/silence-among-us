const Lobby = require('../../classes/Lobby');
const { requireVoiceChannel } = require('./_helpers');

module.exports = async function stopCommand(message) {
    // Make sure the user is in a channel, and we have access.
    const channel = await requireVoiceChannel(message);

    // Leave the channel, no matter what.
    channel.leave();

    // Check if there's a lobby in that channel.
    let lobby = await Lobby.find(channel.id);

    // Respond appropriately.
    if (lobby) {
        await lobby.stop();
        await message.reply("I've ended the lobby in your channel.\n\nLet's play again soon, okay?");
    }
    else await message.reply("I don't have a lobby in your channel.")
};