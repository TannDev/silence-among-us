const { requireLobby, getLobbyInfoEmbed } = require('./_helpers');


module.exports = async function killCommand(message) {
    const lobby = await requireLobby(message);

    // Print a spoiler.
    await message.channel.send(getLobbyInfoEmbed(lobby, {title: "SPOILER!"}))
};