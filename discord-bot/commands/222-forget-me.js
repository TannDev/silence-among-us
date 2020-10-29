const Command = require('.');
const UserConfig = require('../../classes/UserConfig');

module.exports = new Command({
    aliases: ['forget-me'],
    description: 'Erase all information the bot knows about you.',
    handler: async function () {
        // Load properties from the command context.
        const { message } = this;

        // Load the user, then delete them.
        const userConfig = await UserConfig.load(message.author.id);
        await userConfig.delete();

        // Tell them it's done.
        message.reply([
            "Okay. I've forgotten everything I know about you.",
            "**Note:** If you're in any active lobbies, associated data won't be deleted until the lobby ends."
        ].join('\n'));
    }
});