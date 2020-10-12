const { Command, requireTextChannel } = require('.');

module.exports = new Command({
    aliases: ['test', 't'],
    handler: async (message) => {
        const textChannel = await requireTextChannel(message);
        textChannel.send("I understood the test command!");
    }
});