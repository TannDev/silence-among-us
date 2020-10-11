const Guild = require('../../classes/Guild');

/**
 * All registered commands, with their aliases and handlers.
 */
const commands = [
    { aliases: ['stats', 'version', 'v'], handler: require('./stats') },
    { aliases: ['help', 'h', '?'], handler: require('./help') },
    { aliases: ['hello', 'hi', 'hey'], handler: (message) => message.reply('Hello!') },
    { aliases: ['join', 'j'], handler: require('./join') },
    { aliases: ['quit', 'q'], handler: require('./quit') },
    { aliases: ['eject', 'e'], handler: require('./eject') },
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
    // Get the command pattern for this guild.
    const { commandPrefixes } = await Guild.load(message.guild.id);

    // Help users who don't know the command.
    if (message.content.match(/^!sau\s*command/i)) {
        const prefixList = commandPrefixes.map(prefix => `\`${prefix}\``);
        if (prefixList.length > 1) prefixList[prefixList.length - 1] = `or ${prefixList[prefixList.length - 1]}`;
        return message.reply([
            `I'm listening for ${prefixList.join(prefixList.length > 2 ? ', ' : ' ')}`,
            `Try using \`${commandPrefixes[0]} help\` for more information.`
        ].join('\n'));
    }

    // Look for commands.
    const prefix = commandPrefixes.map(prefix => prefix.replace(/[.?*+()\[\]]/g, '\\$&')).join('|');
    const commandPattern = new RegExp(`^(?:${prefix})\\s+(?<rawCommand>\\w+)(?:\\s+(?<rawArguments>.+))?$`, 'i');
    const parsed = message.content.match(commandPattern);

    // If there was no command, return.
    if (!parsed) return;

    // Erase commands to keep the channel clean.
    if (message.deletable) await message.delete();

    // Parse the raw results into a useful command and arguments.
    const { rawCommand, rawArguments } = parsed.groups;
    const command = rawCommand.trim().toLowerCase();
    const arguments = rawArguments ? rawArguments.trim() : '';

    // Find the appropriate command handler.
    const { handler } = commands.find(({ aliases, handler }) => {
        return aliases.some(alias => typeof alias === 'string' ? command === alias : command.match(alias));
    }) || { handler: unknownCommand };

    // Run the handler
    await handler(message, arguments, command);
};
