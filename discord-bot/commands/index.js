/**
 * All registered commands, with their aliases and handlers.
 */
const commands = [
    { aliases: ['version', 'v'], handler: require('./version') },
    { aliases: ['help', 'h', '?'], handler: require('./help') },
    { aliases: ['hello', 'hi', 'hey'], handler: (message) => message.reply('Hello!') },
    { aliases: ['lobby', 'l'], handler: require('./lobby') },
    { aliases: ['intermission', 'i'], handler: require('./intermission') },
    { aliases: ['working', 'work', 'w'], handler: require('./work') },
    { aliases: ['meeting', 'meet', 'm'], handler: require('./meet') },
    { aliases: ['dead', 'kill', 'd', 'k'], handler: require('./kill') },
    { aliases: ['revive'], handler: require('./revive') },
    { aliases: ['spoil'], handler: require('./spoil') },
    { aliases: ['test', 't'], handler: require('./test') }
];

async function unknownCommand(message, arguments, command) {
    return message.reply(`Sorry, I don't recognize \`${command}\`. Try \`!sau help\`.`);
}

module.exports = async function processCommandMessage(message) {
    // Look for commands.
    const commandPattern = /^!s(?:au\s+)?(?<instruction>.+)$/i;
    const parsed = message.content.match(commandPattern);
    if (!parsed) return;
    const arguments = parsed.groups.instruction.split(/\s+/);
    const command = arguments.shift().toLowerCase();

    // Erase commands to keep the channel clean.
    if (message.deletable) await message.delete();

    // Find the appropriate command.
    const { handler } = commands.find(({ aliases, handler }) => {
        return aliases.some(alias => typeof alias === 'string' ? command === alias : command.match(alias));
    }) || { handler: unknownCommand };

    // Run the handler
    await handler(message, arguments, command);
}
