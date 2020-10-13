const Command = require('.');
const UserConfig = require('../../classes/UserConfig');

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

        const userConfig = await UserConfig.load(guildMember.id);
        if (arguments) await userConfig.updateAmongUsName(arguments);
        if (!userConfig.amongUsName) {
            throw new Error("I don't know your in-game name yet, so you need to provide it to join.");
        }

        await lobby.guildMemberJoin(guildMember, userConfig.amongUsName);
    }
});