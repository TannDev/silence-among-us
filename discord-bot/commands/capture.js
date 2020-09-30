const { requireLobby } = require('./_helpers');

module.exports = async function captureCommand(message) {
    const lobby = await requireLobby(message);

    // TODO Make sure that the author is the same user that created the lobby.

    // Get a connect code for the lobby.
};
