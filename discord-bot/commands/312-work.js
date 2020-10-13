const Command = require('.');

module.exports = new Command({
    aliases: ['work', 'working', 'w'],
    description: 'Transition your lobby to the "working" phase.',
    category: 'manual',
    handler: async function() {
        // Load properties from the command context.
        const lobby = await this.requireLobby();

        // Transition.
        await lobby.transition('Working');
    }
});