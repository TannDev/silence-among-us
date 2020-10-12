const { Command, requireLobby } = require('.');


module.exports = new Command({
    aliases: ['eject', 'e'],
    handler: async (message) => {
        const lobby = await requireLobby(message);

        // Eject all the at-mentioned people.
        await lobby.guildMemberEject(...message.mentions.members.array());
    }
});