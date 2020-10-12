const Command = require('.');
const User = require('../../classes/User');

module.exports = new Command({
    aliases: ['join', 'j'],
    options: '[in-game name]',
    description: 'Join the lobby as a player.',
    category: 'core',
    handler: async function() {
        // Load properties from the command context.
        const { arguments } = this;
        const guildMember = await this.requireGuildMember();
        const lobby = await this.requireLobby();

        const user = await User.load(guildMember.id);
        if (arguments) await user.updateAmongUsName(arguments);
        if (!user.amongUsName) throw new Error("I don't know your in-game name yet, so you need to provide it to join.");

        await lobby.guildMemberJoin(guildMember, user.amongUsName);
    }
});