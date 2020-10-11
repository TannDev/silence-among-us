const { requireLobby } = require('./_helpers');


module.exports = async function reviveCommand(message, arguments) {
    const lobby = await requireLobby(message);

    // Find and revive all the targets. (At-mentions, and 'me')
    const targets = [...message.mentions.members.array()];
    if (arguments.match(/\bme\b/i)) targets.push(message.member);
    // noinspection JSCheckFunctionSignatures
    await lobby.guildMemberRevive(...targets);
};