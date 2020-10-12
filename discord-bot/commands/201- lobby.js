const { Command, requireLobby } = require('.');

module.exports = new Command({
    aliases: ['lobby'],
    description: 'Re-post information about the lobby',
    category: 'more',
    handler: async (message) => {
        const lobby = await requireLobby(message);
        await lobby.scheduleInfoPost({ force: true });
    }
});