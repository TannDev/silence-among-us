const { Command, requireLobby } = require('.');

module.exports = new Command({
    aliases: ['kill', 'k', 'dead', 'd'],
    options: '[me] [@mentions...]',
    description: 'Mark players as being dead.',
    handler: async (message, arguments) => {
        const lobby = await requireLobby(message);

        // Find and kill all the targets. (At-mentions, and 'me')
        const targets = [...message.mentions.members.array()];
        if (arguments.match(/\bme\b/i)) targets.push(message.member);
        // noinspection JSCheckFunctionSignatures
        await lobby.guildMemberKill(...targets);
    }
});