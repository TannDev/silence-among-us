const { Command, requireLobby } = require('.');

module.exports = new Command({
    aliases: ['leave', 'l'],
    description: 'Leave the lobby and stop being a player',
    category: 'core',
    handler: async (message) => {
        const lobby = await requireLobby(message);
        await lobby.guildMemberQuit(message.member);
    }
});