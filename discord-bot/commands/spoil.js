const { requireLobby } = require('./_helpers');


module.exports = async function killCommand(message) {
    const lobby = await requireLobby(message);

    // Print a spoiler.
    await lobby.postLobbyInfo({title: "SPOILER!", spoil: true})
};