const { requireLobby } = require('./_helpers');


module.exports = async function killCommand(message, arguments) {
    const lobby = await requireLobby(message);

    // Find and kill all the targets. (At-mentions, and 'me')
    const targets = [...message.mentions.members.array()];
    if (arguments.match(/\bme\b/i)) targets.push(message.member);
    // noinspection JSCheckFunctionSignatures
    await lobby.guildMemberKill(...targets);
};