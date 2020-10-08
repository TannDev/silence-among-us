const { requireLobby } = require('./_helpers');


module.exports = async function ejectCommand(message) {
    const lobby = await requireLobby(message);

    // Kill all the at-mentioned people.
    await lobby.guildMemberEject(...message.mentions.members.array());
};