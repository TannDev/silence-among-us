const Command = require('.');

module.exports = new Command({
    aliases: ['intermission', 'i'],
    description: 'Transition your lobby to the "intermission" phase.',
    category: 'manual',
    handler: async function() {
        // Load properties from the command context.
        const lobby = await this.requireLobby();

        // Transition.
        await lobby.transition('Intermission');
    }
});