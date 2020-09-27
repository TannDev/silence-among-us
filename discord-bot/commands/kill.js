const { requireLobby } = require('./_helpers');


module.exports = async function killCommand(message) {
    const lobby = await requireLobby(message);

    // Kill the at-mentioned players.
    await Promise.all(message.mentions.members.map(member => lobby.killPlayer(member)));
};