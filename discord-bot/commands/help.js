const { MessageEmbed } = require('discord.js');

const instructionsUrl = 'https://github.com/tanndev/silence-among-us#readme';

const commands = [
    '`version|v`: Get version information.',
    '`help|h|?`: Get this help.',
    "`start [room code] [na|eu|asia]`: Start a new lobby.",
    "`stop`: End your lobby.",
    '`room|r [room code] [na|eu|asia]`: Get (or set) the room information of your lobby.',
    '`intermission|i`: Mark your lobby as being in intermission.',
    '`working|work|w`: Mark your lobby as working on tasks.',
    '`meeting|meet|m`: Mark your lobby as being in a meeting.',
    '`dead|kill|d|k <@mentions...>`: Mark the at-mentioned players as being dead.',
    '`revive <@mentions...>`: Mark any at-mentioned players as being alive.'
].map(command => `\t- ${command}`).join('\n');

const helpEmbed = new MessageEmbed()
    .setTitle("Silence Among Us - Help")
    .setURL(instructionsUrl)
    .setDescription("Use `!sau <command>` or `!<command>` to tell me what to do.\nI'll use your current voice channel to find your lobby.")
    .addField('Available Commands', `${commands}\n\nSee the [instructions](${instructionsUrl}) for more details.`)

module.exports = async function helpCommand(message) {
    return message.channel.send(helpEmbed);
};