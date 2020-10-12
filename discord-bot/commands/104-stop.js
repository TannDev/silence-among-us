const { Command, requireLobby } = require('.');

module.exports = new Command({
    aliases: ['stop'],
    description: 'End the lobby.',
    category: 'core',
    handler: async (message, arguments) => {
        const lobby = await requireLobby(message);
        await lobby.stop();
        // TODO Make a pretty embed for this.
        await message.reply("I've ended the lobby in your channel.\nLet's play again soon, okay?");
    }
});