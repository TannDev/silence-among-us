const Command = require('.');
const { MessageEmbed } = require('discord.js');

module.exports = new Command({
    aliases: ['privacy'],
    description: "Review our privacy policy and related commands.",
    category: 'privacy',
    handler: async function () {
        // Load properties from the command context.
        const { message } = this;

        // Set the description.
        const description = [
            "We take your privacy and data seriously!",
            "\nHere's the short version:",
            "- We'll never collect your real name or email address.",
            "- We only store the data we actually need to support the bot's features.",
            "- You can see what data we've collected at any time with the `show-me` command.",
            "- We'll never sell your information. To anyone. Ever.",
            "\nYou can read our [privacy statement](https://github.com/tanndev/silence-among-us#privacy) for details."
        ].join('\n');

        const disclaimer = [
            "This privacy policy _only_ applies to the **official** Tanndev-hosted bot instances.",
            "If this instance is hosted by somebody else, they may not necessarily follow the same guidelines."
        ].join('\n');

        const commands = [require('./221-show-me'), require('./222-forget-me')]
            .map(command => `\t- ${command.toHelpText()}`)
            .join('\n');

        // Generate the basic embed.
        const embed = new MessageEmbed()
            .setTitle("Silence Among Us - Privacy")
            .setURL('https://github.com/tanndev/silence-among-us#privacy')
            .setDescription(description)
            .addField('Related Commands', commands)
            .addField('Disclaimer', disclaimer);

        return message.channel.send(embed);
    }
});