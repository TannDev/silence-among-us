const Command = require('.');

module.exports = new Command({
    aliases: ['raw'],
    handler: async function () {
        // Load properties from the command context.
        const { message } = this;
        const lobby = await this.requireLobby();

        // Print the raw data.
        const data = JSON.stringify(lobby.toJSON(), null, 2);
        message.channel.send(`\`\`\`JSON\n${data}\n\`\`\``);
    }
});