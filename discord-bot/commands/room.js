const { requireLobby, parseRoomCode } = require('./_helpers');

module.exports = async function roomCommand(message, arguments) {
    // Make sure the user is in a channel, and we have access.
    const lobby = await requireLobby(message);

    // If a room code was provided, handle it.
    parseRoomCode(lobby, arguments);

    // Respond with the lobby information.
    await lobby.postLobbyInfo({title: "Room Change"})
};