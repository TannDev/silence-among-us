const { requireLobby } = require('./_helpers');


module.exports = async function lobbyCommand(message) {
    const lobby = await requireLobby(message);

    // Update the lobby info.
    await lobby.postLobbyInfo()
};