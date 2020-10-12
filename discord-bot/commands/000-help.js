const Command = require('.');
const { MessageEmbed } = require('discord.js');

const importantCommands = [
    '`start`: Start a new lobby.',
    '`join|j [in-game name]`: Join the lobby as a player.',
    '`leave|l`: Quit the lobby and stop being a player.',
    '`stop`: End your lobby.'
].map(command => `\t- ${command}`).join('\n');

const importantExamples = [
    '`!sau start`: Start a new lobby.',
    '`!sau join`: Join the current lobby using your previously-saved in-game name.',
    '`!sau join Alice`: Set your in-game name to "Alice" and join the current lobby.'
].map(command => `\t- ${command}`).join('\n');

const moreCommands = [
    '`help|h|?`: Get this help.',
    '`eject|e`: Eject the at-mentioned players from the lobby, as if they quit.',
    '`lobby`: Re-post the info about your lobby.',
    '`stats|version|v`: Get stats about the server running this bot.'
].map(command => `\t- ${command}`).join('\n');

const manualCommands = [
    '`start [room code] [na|eu|asia]`: Start a new lobby with a room code.',
    '`room|r <room code> [na|eu|asia]`: Update the room information of your lobby.',
    '`room|r unlist|remove|x`: Remove the room code for your lobby.',
    '`intermission|i`: Transition your lobby to the "intermission" phase.',
    '`working|work|w`: Transition your lobby to the "working" phase.',
    '`meeting|meet|m`: Transition your lobby to the "meeting" phase.',
    '`dead|kill|d|k <@mentions...>`: Mark the at-mentioned players as being dead.',
    '`revive <@mentions...>`: Mark any at-mentioned players as being alive.'
].map(command => `\t- ${command}`).join('\n');

const moreExamples = [
    '`!sau start abcdef eu`: Start a new lobby with a room code.',
    '`!sau work`: Start a new game, from intermission, or end a meeting.',
    '`!sau kill me @tanner`: Mark yourself and @tanner as dead. (Must be a real at-mention)'
].map(command => `\t- ${command}`).join('\n');

module.exports = new Command({
    aliases: ['help', 'h', '?'],
    handler: async function() {
        // Load properties from the command context.
        const { message, prefix, arguments } = this;

        // TODO Load commands properly.
        const embed = new MessageEmbed()
            .setTitle("Silence Among Us - Help")
            .setURL('https://github.com/tanndev/silence-among-us#silence-among-us')
            // TODO Load the guild's prefixes.
            .setDescription("Use `!sau <command>` or `!s<command>` to tell me what to do.\nI'll use your current voice channel to find your lobby.")
            .addField('Important Commands', importantCommands);

        if (arguments.includes('more')) embed
            .addField('Other Useful Commands', moreCommands)
            .addField('Manually Controlling Games', manualCommands)
            .addField('Examples', moreExamples);
        else embed
            .addField('Examples', importantExamples)
            .addField('Get More Help', `Use \`${prefix} help more\` for all the commands, including how to run games manually.`);

        return message.channel.send(embed);
    }
});