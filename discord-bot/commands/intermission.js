const { Command, requireLobby } = require('.');

module.exports = new Command(['intermission', 'i'], async (message) => {
    const lobby = await requireLobby(message);
    await lobby.transition('Intermission');
});