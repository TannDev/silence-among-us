const Command = require('.');

module.exports = new Command({
    aliases: ['kill', 'k', 'dead', 'd'],
    options: '[me] [@mentions...]',
    description: 'Mark players as being dead.',
    category: 'manual',
    handler: async function() {
        // Load properties from the command context.
        const { message, arguments } = this;
        const lobby = await this.requireLobby();

        // Find and kill all the targets. (At-mentions, and 'me')
        const targets = [...message.mentions.members.array()];
        if (arguments.match(/\bme\b/i)) targets.push(message.member);
        // noinspection JSCheckFunctionSignatures
        await lobby.guildMemberKill(...targets);
    }
});