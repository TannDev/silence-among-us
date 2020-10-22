const Command = require('.');

module.exports = new Command({
    aliases: ['leave', 'l'],
    description: 'Leave the lobby and stop being a player.',
    category: 'core',
    handler: async function() {
        // Load properties from the command context.
        const guildMember = await this.requireGuildMember();
        const lobby = await this.requireLobby();

        await lobby.guildMemberQuit(guildMember);
    }
});