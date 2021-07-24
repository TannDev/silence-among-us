const Command = require('.');

module.exports = new Command({
    aliases: ['menu'],
    description: 'Transition your lobby to the "menu" phase.',
    // This command is intentionally unlisted.
    handler: async function () {
        // Load properties from the command context.
        const lobby = await this.requireLobby();

        // Transition.
        await lobby.transition('Menu');
    }
});