const { Command, requireTextChannel } = require('.');

module.exports = new Command(['test', 't'], async(message) => {
    const textChannel = await requireTextChannel(message)
    textChannel.send("I understood the test command!");
})