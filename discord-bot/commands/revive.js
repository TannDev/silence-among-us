const { requireLobby } = require('./_helpers');


module.exports = async function reviveCommand(message) {
    const lobby = await requireLobby(message);

    // Kill the at-mentioned players.
    await Promise.all(message.mentions.members.map(member => lobby.revivePlayer(member)));
};