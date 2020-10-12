const Lobby = require('../../classes/Lobby');
const Guild = require('../../classes/Guild');

/**
 * All commands, mapped by alias.
 * @type {Map<string, Command>}
 */
const commandsByAlias = new Map();

/**
 * All the registered commands, in sorted order.
 *
 * @type {Set<Command>}
 */
const commands = new Set();

class Command {

    /**
     * Find a command that matches.
     * @param alias
     * @returns {Command}
     */
    static find(alias) {
        if (!alias || typeof alias !== 'string') return null;
        return commandsByAlias.get(alias.toLowerCase());
    }

    static all() {
        return commands;
    }

    static async processMessage(message) {
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

        // Look for instruction.
        const prefixes = commandPrefixes.map(prefix => prefix.replace(/[.?*+()\[\]]/g, '\\$&')).join('|');
        const pattern = new RegExp(`^(?<prefix>${prefixes})\\s+(?<alias>\\S+)(?:\\s+(?<args>.+))?$`, 'i');
        const instruction = message.content.match(pattern);

        // If there was no instruction, return.
        if (!instruction) return;

        // Erase messages to keep the channel clean.
        if (message.deletable) await message.delete();

        // Extract the components
        const { prefix, alias, args } = instruction.groups;

        // Find the appropriate command.
        const command = Command.find(alias);
        if (!command) return message.reply(`Sorry, I don't recognize \`${alias}\`. Try \`${prefix} help\`.`);

        // Execute the command in the appropriate context.
        const context = new CommandContext(command, message, prefix, alias, args ? args.trim() : '');
        return command.handler.bind(context)();
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

module.exports = Command;

class CommandContext {
    constructor(command, message, prefix, alias, args) {
        this.command = command;
        this.message = message;
        this.prefix = prefix;
        this.alias = alias;
        this.arguments = args;
    }

    /**
     * Requires that the given message came via a guild.
     * If not, throws an error.
     *
     * @returns {Promise<Discord.GuildMember>}
     */
    async requireGuildMember() {
        const { member } = this.message;
        if (!member) throw new Error("I can't do that via direct-message. Try using a text channel.");

        return member ;
    }

    /**
     * Requires that the message came from a guild channel.
     * If not, throws an error.
     *
     * @returns {Promise<Discord.TextChannel>}
     */
    async requireTextChannel() {
        const { channel: textChannel, guild } = this.message
        if (!guild) throw new Error("I can't do that via direct-message. Try using a text channel.");
        return textChannel;
    }

    /**
     * Requires that the sender of the given message is currently in a voice channel.
     * If not, throws an error.
     *
     * @returns {Promise<Discord.VoiceChannel>}
     */
    async requireVoiceChannel() {
        const member = await this.requireGuildMember();
        const { voice: { channel: voiceChannel } } = member;
        if (!voiceChannel) throw new Error("I can't do that. You're not in a voice channel here.");
        return voiceChannel;
    }

    /**
     * Requires that the sender of the given message is currently in a tracked lobby.
     * If not, throws an error which will be sent as a reply.
     *
     * @returns {Promise<Lobby>}
     */
    async requireLobby() {
        const voiceChannel = await this.requireVoiceChannel();
        const lobby = await Lobby.findByVoiceChannel(voiceChannel);
        if (!lobby) throw new Error(`There's not a lobby for your voice channel. Try \`${this.prefix} start\`!`);
        return lobby;
    }
}

// Load all commands automatically.
require('fs')
    .readdirSync(__dirname)
    .filter(filename => filename.match(/^[^_].+\.js$/i) && filename !== 'index.js')
    .forEach(filename => commands.add(require(`./${filename}`)));
