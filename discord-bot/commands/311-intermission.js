const { Command, requireLobby } = require('.');

module.exports = new Command({
    aliases: ['intermission', 'i'],
    description: 'Transition your lobby to the "intermission" phase.',
    category: 'manual',
    handler: async (message) => {
        const lobby = await requireLobby(message);
        await lobby.transition('Intermission');
    }
});