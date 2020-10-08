const { MessageEmbed } = require('discord.js');

const instructionsUrl = 'https://github.com/tanndev/silence-among-us#readme';

const commands = [
    '`version|v`: Get version information.',
    '`help|h|?`: Get this help.',
    '`join|j <in-game name>`: Join the lobby as a player.',
    '`quit|q`: Quit the lobby and stop being a player.',
    '`eject|e`: Eject the at-mentioned players from the lobby, as if they quit.',
    '`lobby|l`: Re-post information about your lobby.',
    '`lobby|l start [room code] [na|eu|asia]`: Start a new lobby.',
    '`lobby|l stop`: End your lobby.',
    '`lobby|l room|r <room code> [na|eu|asia]`: Update the room information of your lobby.',
    '`lobby|l room|r unlist|remove|x`: Remove the room information of your lobby.',
    '`intermission|i`: Transition your lobby to the "intermission" phase.',
    '`working|work|w`: Transition your lobby to the "working" phase.',
    '`meeting|meet|m`: Transition your lobby to the "meeting" phase.',
    '`dead|kill|d|k <@mentions...>`: Mark the at-mentioned players as being dead.',
    '`revive <@mentions...>`: Mark any at-mentioned players as being alive.'
].map(command => `\t- ${command}`).join('\n');

const examples = [
    '`!sau lobby start`: Start a new lobby with no room code.',
    '`!sl start abcdef eu`: Start a new lobby with a room code.',
    '`!sau work`: Start a new game, from intermission, or end a meeting.',
    '`!sw`: Same thing as `!sau work`, but shorter.',
    '`!sk me @tanner`: Mark yourself and @tanner as dead. (Must be a real at-mention)'
].map(command => `\t- ${command}`).join('\n');

const helpEmbed = new MessageEmbed()
    .setTitle("Silence Among Us - Help")
    .setURL(instructionsUrl)
    .setDescription("Use `!sau <command>` or `!s<command>` to tell me what to do.\nI'll use your current voice channel to find your lobby.")
    .addField('Available Commands', `${commands}\n\nSee the [instructions](${instructionsUrl}) for more details.`)
    .addField('Examples', examples);

module.exports = async function helpCommand(message) {
    return message.channel.send(helpEmbed);
};