const { requireLobby } = require('./_helpers');


module.exports = async function joinCommand(message, arguments) {
    const lobby = await requireLobby(message);

    const amongUsName = arguments.join(' ');

    if (!amongUsName.trim()) throw new Error("You must include your in-game name to join.")

    // TODO Accept a color

    await lobby.guildMemberJoin(message.member, amongUsName)
};