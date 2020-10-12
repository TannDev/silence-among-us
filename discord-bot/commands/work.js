const { Command, requireLobby } = require('.');

module.exports = new Command([ 'work', 'working', 'w'], async (message) => {
    const lobby = await requireLobby(message);
    await lobby.transition('Working')
});