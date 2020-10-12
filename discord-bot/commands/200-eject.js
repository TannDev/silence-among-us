const Command = require('.');


module.exports = new Command({
    aliases: ['eject', 'e'],
    handler: async function() {
        // Load properties from the command context.
        const { message } = this;
        const lobby = await this.requireLobby();

        // Eject all the at-mentioned people.
        await lobby.guildMemberEject(...message.mentions.members.array());
    }
});