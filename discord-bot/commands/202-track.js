const Command = require('.');
const UserConfig = require('../../classes/UserConfig');

module.exports = new Command({
    aliases: ['track'],
    options: '<@mention> <in-game name>',
    description: 'Add player to the lobby, as if one used `join`.',
    category: 'more',
    handler: async function() {
        // Load properties from the command context.
        const { message, arguments } = this;
        const lobby = await this.requireLobby();

        if (message.mentions.members.size !== 1) throw new Error("The command must contain one mentoin.");

        const guildMember = message.mentions.members.array().shift();
        const split = arguments.split(/ +/);
        const amongUsName = split.slice(1).join(' ');

        if (amongUsName.length === 0) throw new Error("The command must contain the in-game name.");

        const userConfig = await UserConfig.load(guildMember.id);

        await userConfig.updateAmongUsName(amongUsName);
        await lobby.guildMemberJoin(guildMember, userConfig.amongUsName);
    }
});
