const Command = require('.');

module.exports = new Command({
    aliases: ['spoil'],
    handler: async function() {
        // Load properties from the command context.
        const lobby = await this.requireLobby();

        // Print a spoiler.
        await lobby.scheduleInfoPost({ spoil: true });
    }
});