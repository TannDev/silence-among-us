const { Command, requireLobby } = require('.');

module.exports = new Command({
    aliases: ['meet', 'meeting', 'm'],
    description: 'Transition your lobby to the "meeting" phase.',
    category: 'manual',
    handler: async (message) => {
        const lobby = await requireLobby(message);
        await lobby.transition('Meeting');
    }
});