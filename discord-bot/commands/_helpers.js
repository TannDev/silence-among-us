const { Permissions } = require('discord.js');
const Lobby = require('../../classes/Lobby');
const Room = require('../../classes/Room');

const requiredTextPermissionsFlags = [
    'VIEW_CHANNEL',
    'SEND_MESSAGES',
    'MANAGE_MESSAGES'
]
const requiredTextPermissions = new Permissions((requiredTextPermissionsFlags));
const requiredVoicePermissionsFlags = [
    // TODO Confirm that 'CONNECT' and 'SPEAK' aren't required.
    'VIEW_CHANNEL',
    'MUTE_MEMBERS',
    'DEAFEN_MEMBERS'
]
const requiredVoicePermissions = new Permissions(requiredVoicePermissionsFlags)

class ReplyError extends Error {
    constructor(reply) {
        super();
        this.reply = reply;
    }
}

/**
 * Requires that the given message came via a guild.
 * If not, throws an error which will be sent as a reply.
 *
 * @param {Discord.Message} message
 * @returns {Promise<Discord.GuildMember>}
 */
async function requireGuildMember(message) {
    const { member } = message;
    if (!member) throw new ReplyError("I can't do that via direct-message. Try using a text channel.");

    return member ;
}

async function requireTextChannel(message) {
    const { channel: textChannel, guild } = message
    if (!guild) throw new ReplyError("I can't do that via direct-message. Try using a text channel.");

    // Check permissions on the channel.
    if (!textChannel.permissionsFor(guild.me).has(requiredTextPermissions)){
        throw new ReplyError([
            'Sorry, I don\'t have enough permissions in this text channel.',
            `I need the following:\n\t- ${requiredTextPermissionsFlags.join('\n\t- ')}`
        ].join('\n'))
    }

    return textChannel;
}

/**
 * Requires that the sender of the given message is currently in a voice channel.
 * If not, throws an error which will be sent as a reply.
 *
 * @param {Discord.Message} message
 * @returns {Promise<Discord.VoiceChannel>}
 */
async function requireVoiceChannel(message) {
    const member = await requireGuildMember(message);
    const { voice: { channel: voiceChannel } } = member;
    if (!voiceChannel) throw new ReplyError("I can't do that. You're not in a voice channel here.");

    // Check channel permissions.
    if (!voiceChannel.permissionsFor(voiceChannel.guild.me).has(requiredVoicePermissions)){
        throw new ReplyError([
            'Sorry, I don\'t have enough permissions in that voice channel.',
            `I need the following:\n\t- ${requiredVoicePermissionsFlags.join('\n\t- ')}`
        ].join('\n'))
    }

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
    const lobby = await Lobby.find(voiceChannel);
    if (!lobby) throw new ReplyError("There's not a lobby for your voice channel. Start one with `!sau start`!");

    return lobby;
}

/**
 * Parses the room code and returns a room.
 * If a lobby is provided, it is also updated automatically.
 *
 * @param arguments
 * @param {Lobby} [lobby]
 * @return {Room}
 */
function parseRoomCode(arguments, lobby) {
    if (arguments.length < 1) return null;
    const [code, region] = arguments;

    // If a code was provided, handle it.
    if (code) {
        // If the "code" is an unlist instruction, delete it and return.
        if (code.match(/unlist|delete|remove|private/i)) {
            if (lobby) delete lobby.room;
            return null;
        }

        // Otherwise, store the new room code.
        // TODO Load this pattern from the schema, instead of hardcoding it.
        if (!code.match(/^[a-z]{6}$/i)) throw new ReplyError("That room code doesn't make sense.");
        const room = new Room(code, region);
        if (lobby) lobby.room = room;
        return room;
    }
}

module.exports = {
    ReplyError,
    requireGuildMember,
    requireTextChannel,
    requireVoiceChannel,
    requireLobby,
    parseRoomCode
};