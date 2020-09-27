const { MessageEmbed } = require('discord.js');

const instructionsUrl = 'https://github.com/tanndev/silence-among-us#readme';

const commands = [
    '`version|v`: Get version information.',
    '`help|h|?`: Get this help.',
    "`start`: Start a new lobby. (This **doesn't** start the game. Use `working` for that.)",
    "`stop`: End your lobby. (This **doesn't** end the game. Use `intermission` for that.)",
    '`room|r [room code] [na|eu|asia]`: Get (or set) the room information of your lobby.',
    '`intermission|i`: Mark your lobby as being in intermission. (End a game.)',
    '`working|work|w`: Mark your lobby as working on tasks. (Start a game, or end a meeting.)',
    '`meeting|meet|m`: Mark your lobby as being in a meeting.',
    '`dead|kill|d|k <@mentions...>`: Mark the at-mentioned players as being dead.',
    '`revive <@mentions...>`: Mark any at-mentioned players as being alive.'
].map(command => `\t- ${command}`).join('\n');

const helpEmbed = new MessageEmbed()
    .setTitle("Silence Among Us - Help")
    .setURL(instructionsUrl)
    .setDescription("Use `!sau <command>` or `!<command>` to tell me what to do.\nI'll use your current voice channel to find your lobby.")
    .addField('Available Commands', `${commands}\n\nSee the instructions for more details:\n${instructionsUrl}`)

module.exports = async function helpCommand(message) {
    return message.channel.send(helpEmbed);
};