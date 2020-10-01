const { requireLobby } = require('./_helpers');


module.exports = async function joinCommand(message, arguments) {
    const lobby = await requireLobby(message);

    const name = arguments.join(' ');

    if (!name.trim()) throw new Error("You must include your in-game name to join.")

    await lobby.joinPlayerToGame(message.member, { name })
    await lobby.postLobbyInfo();
};