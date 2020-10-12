const { Command, requireLobby } = require('.');

module.exports = new Command(['leave', 'l'], async (message) => {
    const lobby = await requireLobby(message);
    await lobby.guildMemberQuit(message.member)
});