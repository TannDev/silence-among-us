const commands = [
    '`version|v: Get version information.',
    '`help|h|?`: Get this help.',
    "`start`: Start a new lobby. (This **doesn't** start the game. Use `working` for that.)",
    "`stop`: End your lobby. (This **doesn't** end the game. Use `intermission` for that.)",
    '`room|r [room code] [region]`: Get (or set) the room information of your lobby.',
    '`intermission|i`: Mark your lobby as being in intermission. (End a game.)',
    '`working|work|w`: Mark your lobby as working on tasks. (Start a game, or end a meeting.)',
    '`meeting|meet|m`: Mark your lobby as being in a meeting.',
    '`dead|kill|d|k <@mentions...>`: Mark the at-mentioned players as being dead.',
    '`revive <@mentions...>`: Mark any at-mentioned players as being alive.'
].map(command => `\t- ${command}`).join('\n');

const reply = [
    "Use `!sau <command>` or `!s<command>` to tell me what to do.",
    "When you give me a command, I'll use your current voice channel to find your lobby.",
    '',
    "Available commands:",
    commands,
    '',
    "For more information, see my [instructions](https://github.com/tanndev/silence-among-us#readme)."
].join('\n')

module.exports = async function helpCommand(message) {
    return message.reply(reply);
}