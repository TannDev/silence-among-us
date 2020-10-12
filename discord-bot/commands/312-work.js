const { Command, requireLobby } = require('.');

module.exports = new Command({
    aliases: ['work', 'working', 'w'],
    description: 'Transition your lobby to the "working" phase.',
    category: 'manual',
    handler: async (message) => {
        const lobby = await requireLobby(message);
        await lobby.transition('Working');
    }
});