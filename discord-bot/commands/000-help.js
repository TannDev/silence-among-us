const Command = require('.');
const { MessageEmbed } = require('discord.js');

module.exports = new Command({
    aliases: ['help', 'h', '?'],
    handler: async function () {
        // Load properties from the command context.
        const { message, prefix: originalPrefix, alias, arguments } = this;

        // Ignore the original prefix if this is a dm.
        const prefix = message.guild ? originalPrefix : '!sau';

        // Determine if the user wants more.
        const displayMore = arguments.match(/\bmore\b/i);

        // Set the description.
        const description = [
            `Use \`${prefix} <command> [options]\` to tell me what to do.`,
            "I'll use your current voice channel to find your lobby."
        ].join('\n');

        // Get the commands.
        const commands = Command.all();
        const coreCommands = commands.filter(command => command.category === 'core');
        const moreCommands = commands.filter(command => command.category === 'meta' || command.category === 'more');
        const manualCommands = commands.filter(command => command.category === 'manual');

        // Generate the examples.
        // TODO Do this automatically from the command definitions.
        const coreExamples = [
            "Here's come examples of how you might use the commands above:",
            `\`${prefix} start\`: Start a new lobby.`,
            `\`${prefix} join\`: Join the current lobby using your previously-saved in-game name.`,
            `\`${prefix} join Alice\`: Set your in-game name to "Alice" and join the current lobby.`
        ];
        const moreExamples = [
            ...coreExamples,
            `\`${prefix} start abcdef eu\`: Start a new lobby with a room code.`,
            `\`${prefix} work\`: Start a new game, from intermission, or end a meeting.`,
            `\`${prefix} kill me @tanner\`: Mark yourself and @tanner as dead. (Must be a real at-mention)`,
            `\`${prefix} config set prefix !sau !s\`: Set the command prefix in this server to accept "!sau" or "!s"`
        ];
        const examples = (displayMore ? moreExamples : coreExamples).join('\n\t- ');

        // Generate the basic embed.
        const embed = new MessageEmbed()
            .setTitle("Silence Among Us - Help")
            .setURL('https://github.com/tanndev/silence-among-us#silence-among-us')
            .setDescription(description)
            .addField('Important Commands', generateHelpText(coreCommands));


        // If they asked for more, augment the embed with more.
        if (displayMore) {
            embed.addField('Other Useful Commands', generateHelpText(moreCommands));
            embed.addField('Manually Controlling Games', generateHelpText(manualCommands));
        }

        // Add examples.
        embed.addField('Examples', examples);

        // If they didn't ask for more, augment the embed with ways to get more help.
        if (!displayMore) {
            embed.addField('Get More Help', `Use \`${prefix} ${alias} more\` for all the commands.`);
        }

        // Add privacy information.
        const privacy = `Use \`${prefix} privacy\` to review our privacy policy and related commands.`;
        embed.addField('Privacy & Data Security', privacy);

        return message.channel.send(embed);
    }
});

function generateHelpText(commands) {
    return commands
        .map(command => command.toHelpText())
        .filter(text => text)
        .map(text => `\t- ${text}`)
        .join('\n');
}