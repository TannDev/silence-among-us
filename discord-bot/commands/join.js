const { requireLobby } = require('./_helpers');
const User = require('../../classes/User');


module.exports = async function joinCommand(message, arguments) {
    const lobby = await requireLobby(message);

    const updatedAmongUsName = arguments.join(' ').trim();

    const user = await User.load(message.author.id);
    if (updatedAmongUsName) await user.updateAmongUsName(updatedAmongUsName);
    if (!user.amongUsName) throw new Error("I don't know your in-game name, so you need to provide it to join.")

    await lobby.guildMemberJoin(message.member, user.amongUsName)
};