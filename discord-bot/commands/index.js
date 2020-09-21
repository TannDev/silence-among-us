const versionCommand = require('./version');
const helpCommand = require('./help');
const joinCommand = require('./join');

async function notImplementedCommand(message, command) {
    return message.reply(`I understood the "${command}" command, but I can't handle it yet.`);
}

async function unknownCommand(message, command) {
    return message.reply(`Sorry, I don't recognize \`${command}\`. Try \`!sau help\`.`);
}

/**
 * All registered commands, with their aliases and handlers.
 */
const commands = [
    { aliases: ['version', 'v'], handler: require('./version') },
    { aliases: ['help', 'h', '?'], handler: require('./help') },
    { aliases: ['hello', 'hi', 'hey'], handler: (message) => message.reply('Hello!') },
    { aliases: ['join'], handler: require('./join') },
    { aliases: ['leave'], handler: require('./leave') },
    { aliases: ['room', 'r'], handler: notImplementedCommand },
    { aliases: ['intermission', 'i'], handler: notImplementedCommand },
    { aliases: ['working', 'work', 'w'], handler: notImplementedCommand },
    { aliases: ['meeting', 'meet', 'm'], handler: notImplementedCommand },
    { aliases: ['dead', 'kill', 'd', 'k'], handler: notImplementedCommand },
    { aliases: ['revive'], handler: notImplementedCommand }
];

module.exports = async function processCommandMessage(message) {
    // Look for commands.
    const commandPattern = /^!s(?:au)?\s*(?<instruction>.+)$/i;
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
    await handler(message, command, arguments);
}
