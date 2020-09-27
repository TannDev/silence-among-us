const Lobby = require('../../classes/Lobby');
const { ReplyError, requireLobby } = require('./_helpers');


module.exports = async function killCommand(message, arguments) {
    const lobby = await requireLobby(message);

    if (lobby.state === Lobby.STATE.INTERMISSION) throw new ReplyError("You can't kill people during intermission.");

    // Find and kill all the targets. (At-mentions, and 'me')
    const targets = [...message.mentions.members.array()];
    if (arguments.includes('me')) targets.push(message.member);
    // noinspection JSCheckFunctionSignatures
    await lobby.killPlayer(...targets);
};