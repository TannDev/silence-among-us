
async function notImplementedCommand(message, command) {
    return message.reply(`I understood the "${command}" command, but I can't handle it yet.`);
}

module.exports = async function executeCommandMessage(message) {
    // Look for commands.
    const commandPattern = /^!s(?:au)?\s*(?<instruction>.*)$/i;
    const parsed = message.content.match(commandPattern);
    if (!parsed) return;
    const [command, ...arguments] = parsed.groups.instruction.split(/\s+/);

    // Erase commands to keep the channel clean.
    message.delete();

    // Handle commands
    if (command.match(/^(?:version|v|\?)$/i)) return require('./version')(message);
    if (command.match(/^(?:help|h|\?)$/i)) return require('./help')(message);
    if (command.match(/^(?:hello|hi|he+y+)$/i)) return message.reply('Hello!');
    if (command.match(/^(?:join)$/i)) return notImplementedCommand(message, command);
    if (command.match(/^(?:leave)$/i)) return notImplementedCommand(message, command);
    if (command.match(/^(?:room|r)$/i)) return notImplementedCommand(message, command);
    if (command.match(/^(?:intermission|i)$/i)) return notImplementedCommand(message, command);
    if (command.match(/^(?:working|work|w)$/i)) return notImplementedCommand(message, command);
    if (command.match(/^(?:meeting|meet|m)$/i)) return notImplementedCommand(message, command);
    if (command.match(/^(?:dead|kill|d|k)$/i)) return notImplementedCommand(message, command);
    if (command.match(/^(?:revive)$/i)) return notImplementedCommand(message, command);

    // Handle unrecognized commands.
    return message.reply(`Sorry, I don't recognize that command (\`${command}\`. Try \`!sau help\`.`);
}