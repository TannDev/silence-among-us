const Command = require('.');

module.exports = new Command({
    aliases: ['stop'],
    description: 'End the lobby.',
    category: 'core',
    handler: async function() {
        // Load properties from the command context.
        const lobby = await this.requireLobby();

        await lobby.stop();
        // TODO Make a pretty embed for this.
        await this.message.reply("I've ended the lobby in your channel.\nLet's play again soon, okay?");
    }
});