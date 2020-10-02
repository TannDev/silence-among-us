const { requireLobby } = require('./_helpers');


module.exports = async function quitCommand(message) {
    const lobby = await requireLobby(message);

    await lobby.guildMemberQuit(message.member)
};