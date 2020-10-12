const { Command, requireLobby } = require('.');

module.exports = new Command(['spoil'], async (message) => {
    const lobby = await requireLobby(message);

    // Print a spoiler.
    await lobby.scheduleInfoPost({ spoil: true });
});