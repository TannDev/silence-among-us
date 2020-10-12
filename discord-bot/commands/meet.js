const { Command, requireLobby } = require('.');

module.exports = new Command(['meet', 'meeting', 'm'], async (message) => {
    const lobby = await requireLobby(message);
    await lobby.transition('Meeting')
});