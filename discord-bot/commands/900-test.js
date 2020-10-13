const Command = require('.');

module.exports = new Command({
    aliases: ['test', 't'],
    handler: async function () {
        // Load properties from the command context.
        const {prefix, alias, arguments} = this;

        const textChannel = await this.requireTextChannel();
        const echo = `${prefix} ${alias} ${arguments}`.trim();
        textChannel.send(`I'm working in context! You said: \`${echo}\``);
    }
});