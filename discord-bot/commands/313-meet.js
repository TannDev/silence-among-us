const Command = require('.');

module.exports = new Command({
    aliases: ['meet', 'meeting', 'm'],
    description: 'Transition your lobby to the "meeting" phase.',
    category: 'manual',
    handler: async function() {
        // Load properties from the command context.
        const lobby = await this.requireLobby();

        // Transition.
        await lobby.transition('Meeting');
    }
});