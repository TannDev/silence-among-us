module.exports = async function helpCommand(message) {
    const reply = [
        'You can use any of the following commands:\n(Use `!sau <command>`, or just `!s<command>`)',
        '`version|v: Get version information',
        '`help|h|?`: Get this help.',
        '`join`: Start a new lobby using your current voice channel.',
        '`leave`: End your lobby.',
        '`room|r [room code] [region]`: Get (or set) the room information of your lobby.',
        '`intermission|i`: Mark your lobby as being in intermission. (End a game.)',
        '`working|work|w`: Mark your lobby as working on tasks. (Start a game, or end a meeting.)',
        '`meeting|meet|m`: Mark your lobby as being in a meeting.',
        '`dead|kill|d|k <@mentions...>`: Mark the at-mentioned players as being dead.',
        '`revive <@mentions...>`: Mark any at-mentioned players as being alive.'
    ].join('\n- ');
    return message.reply(reply);
}