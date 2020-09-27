const { requireLobby } = require('./_helpers');

module.exports = async function stopCommand(message) {
    const lobby = await requireLobby(message);

    await lobby.stop();
    await message.reply("I've ended the lobby in your channel.\nLet's play again soon, okay?");

    // TODO Say goodbye in the channel.

    // Leave the channel, no matter what.
    lobby.voiceChannel.leave();
};