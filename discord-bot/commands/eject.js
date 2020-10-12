const { Command } = require('.');


module.exports = new Command(['eject', 'e'], async (message) => {
    const lobby = await this.requireLobby(message);

    // Kill all the at-mentioned people.
    await lobby.guildMemberEject(...message.mentions.members.array());
})