const Command = require('.');

module.exports = new Command({
    aliases: ['revive'],
    options: '[me] [@mentions...]',
    description: 'Mark players as being alive.',
    category: 'manual',
    handler: async function() {
        // Load properties from the command context.
        const { message, arguments } = this;
        const lobby = await this.requireLobby();

        // Find and revive all the targets. (At-mentions, and 'me')
        const targets = [...message.mentions.members.array()];
        if (arguments.match(/\bme\b/i)) targets.push(message.member);
        // noinspection JSCheckFunctionSignatures
        await lobby.guildMemberRevive(...targets);
    }
});