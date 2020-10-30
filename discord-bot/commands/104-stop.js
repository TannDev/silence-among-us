const Command = require('.');

module.exports = new Command({
    aliases: ['stop'],
    description: 'End the lobby.',
    category: 'core',
    handler: async function() {
        // Load properties from the command context.
        const { message } = this;
        const lobby = await this.requireLobby();
        await lobby.stop(`<@${message.author.id}> ended the lobby.`);
    }
});