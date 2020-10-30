const Command = require('.');

module.exports = new Command({
    aliases: ['leave', 'l'],
    description: 'Manually return to spectating',
    category: 'more',
    handler: async function () {
        // Load properties from the command context.
        const guildMember = await this.requireGuildMember();
        const lobby = await this.requireLobby();

        await lobby.guildMemberQuit(guildMember);
    }
});