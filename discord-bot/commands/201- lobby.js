const Command = require('.');

module.exports = new Command({
    aliases: ['lobby'],
    description: 'Re-post information about the lobby.',
    category: 'more',
    handler: async function() {
        // Load properties from the command context.
        const lobby = await this.requireLobby();
        await lobby.scheduleInfoPost({ force: true });
    }
});