const { Command, requireLobby } = require('.');

module.exports = new Command(['revive'], async (message, arguments) => {
    const lobby = await requireLobby(message);

    // Find and revive all the targets. (At-mentions, and 'me')
    const targets = [...message.mentions.members.array()];
    if (arguments.match(/\bme\b/i)) targets.push(message.member);
    // noinspection JSCheckFunctionSignatures
    await lobby.guildMemberRevive(...targets);
});