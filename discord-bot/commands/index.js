const Lobby = require('../../classes/Lobby');
const Guild = require('../../classes/Guild');

/**
 * All commands, mapped by alias.
 * @type {Map<string, Command>}
 */
const commandsByAlias = new Map();

class Command {

    /**
     * Find a command that matches.
     * @param command
     * @returns {Command|null}
     */
    static find(command) {
        if (!command || typeof command !== 'string') return null;
        return commandsByAlias.get(command.toLowerCase());
    }

    static async processMessage(message) {
        // Get the command pattern for this guild.
        const { commandPrefixes } = await Guild.load(message.guild.id);
        const demoCommand = `\`${commandPrefixes[0]} help\``;

        // Help users who don't know the command.
        if (message.content.match(/^!sau\s*command/i)) {
            const prefixList = commandPrefixes.map(prefix => `\`${prefix}\``);
            if (prefixList.length > 1) prefixList[prefixList.length - 1] = `or ${prefixList[prefixList.length - 1]}`;
            return message.reply([
                `I'm listening for ${prefixList.join(prefixList.length > 2 ? ', ' : ' ')}`,
                `Try using ${demoCommand} for more information.`
            ].join('\n'));
        }

        // Look for instruction.
        const prefix = commandPrefixes.map(prefix => prefix.replace(/[.?*+()\[\]]/g, '\\$&')).join('|');
        const commandPattern = new RegExp(`^(?:${prefix})\\s+(?<cmd>\\w+)(?:\\s+(?<args>.+))?$`, 'i');
        const instruction = message.content.match(commandPattern);

        // If there was no instruction, return.
        if (!instruction) return;

        // Erase messages to keep the channel clean.
        if (message.deletable) await message.delete();

        // Extract the components
        const { cmd, args } = instruction.groups;

        // Find the appropriate command.
        const command = Command.find(cmd);
        if (!command) return message.reply(`Sorry, I don't recognize \`${cmd}\`. Try ${demoCommand}.`);

        // Execute the command.
        return command.handler(message, args ? args.trim() : '');
    }

    constructor({aliases, handler, options, description, category}) {
        // Store all the aliases in lowercase.
        this.aliases = aliases.map(alias => alias.toLowerCase());

        // Store the help information.
        this.options = options;
        this.description = description;
        this.category = category

        // Map all aliases, forbidding duplicates.
        this.aliases.forEach(alias => {
            if (commandsByAlias.has(alias)) throw new Error(`Duplicate command alias: ${alias}`);
            commandsByAlias.set(alias, this);
        });

        // Store the handler.
        this.handler = handler;
    }
}

/**
 * Requires that the given message came via a guild.
 * If not, throws an error.
 *
 * @param {Discord.Message} message
 * @returns {Promise<Discord.GuildMember>}
 */
async function requireGuildMember(message) {
    const { member } = message;
    if (!member) throw new Error("I can't do that via direct-message. Try using a text channel.");

    return member ;
}

async function requireTextChannel(message) {
    const { channel: textChannel, guild } = message
    if (!guild) throw new Error("I can't do that via direct-message. Try using a text channel.");
    return textChannel;
}

/**
 * Requires that the sender of the given message is currently in a voice channel.
 * If not, throws an error.
 *
 * @param {Discord.Message} message
 * @returns {Promise<Discord.VoiceChannel>}
 */
async function requireVoiceChannel(message) {
    const member = await requireGuildMember(message);
    const { voice: { channel: voiceChannel } } = member;
    if (!voiceChannel) throw new Error("I can't do that. You're not in a voice channel here.");
    return voiceChannel;
}

/**
 * Requires that the sender of the given message is currently in a tracked lobby.
 * If not, throws an error which will be sent as a reply.
 *
 * @param {Discord.Message} message
 * @returns {Promise<Lobby>}
 */
async function requireLobby(message) {
    const voiceChannel = await requireVoiceChannel(message);
    const lobby = await Lobby.findByVoiceChannel(voiceChannel);
    // TODO Get the right command prefix.
    if (!lobby) throw new Error("There's not a lobby for your voice channel. Start one with `!sau start`!");

    return lobby;
}

// Export the class, and all the helpers.
module.exports = {
    Command,
    requireGuildMember,
    requireTextChannel,
    requireVoiceChannel,
    requireLobby
};

// Load all commands automatically.
require('fs')
    .readdirSync(__dirname)
    .filter(filename => filename.match(/^[^_].+\.js$/i) && filename !== 'index.js')
    .forEach(filename => require(`./${filename}`));
