const { Command, requireLobby } = require('.');

module.exports = new Command({
    aliases: ['revive'],
    options: '[me] [@mentions...]',
    description: 'Mark players as being alive.',
    handler: async (message, arguments) => {
        const lobby = await requireLobby(message);

        // Find and revive all the targets. (At-mentions, and 'me')
        const targets = [...message.mentions.members.array()];
        if (arguments.match(/\bme\b/i)) targets.push(message.member);
        // noinspection JSCheckFunctionSignatures
        await lobby.guildMemberRevive(...targets);
    }
});