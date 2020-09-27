const Lobby = require('../../classes/Lobby');
const Room = require('../../classes/Room');

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

/**
 * Requires that the sender of the given message is currently in a voice channel.
 * If not, throws an error which will be sent as a reply.
 *
 * @param {Discord.Message} message
 * @returns {Promise<Discord.VoiceChannel>}
 */
async function requireVoiceChannel(message) {
    const member = await requireGuildMember(message);
    const { voice: { channel } } = member;
    if (!channel) throw new ReplyError("I can't do that. You're not in a voice channel here.");
    if (!channel.manageable) throw new ReplyError("Sorry, I don't have permission to manage that channel.");

    return channel;
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

function parseRoomCode(lobby, arguments) {
    if (arguments.length < 1) return;
    const [code, region] = arguments;

    // If a code was provided, handle it.
    if (code) {
        // If the "code" is an unlist instruction, delete it and return.
        if (code.match(/unlist|delete|remove|private/i)) delete lobby.room;

        // Otherwise, store the new room code.
        else {
            // TODO Load this pattern from the schema, instead of hardcoding it.
            if (!code.match(/^[a-z]{6}$/i)) throw new ReplyError("That room code doesn't make sense.");
            lobby.room = new Room(code, region);
        }
    }
}

module.exports = {
    ReplyError,
    requireGuildMember,
    requireVoiceChannel,
    requireLobby,
    parseRoomCode
};