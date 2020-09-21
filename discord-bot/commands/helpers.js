const Lobby = require('../../classes/Lobby');

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
    return member;
}

/**
 * Requires that the sender of the given message is currently in a voice channel.
 * If not, throws an error which will be sent as a reply.
 *
 * @param {Discord.Message} message
 * @returns {Promise<Discord.VoiceChannel>}
 */
async function requireVoiceChannel(message) {
    const { voice: { channel } } = await requireGuildMember(message);
    if (!channel) throw new ReplyError("I can't do that. You're not in a voice channel here.");
    return channel;
}

async function requireLobby(message) {
    const { id } = await requireVoiceChannel(message);
    const lobby = await Lobby.find(id);
    if (!lobby)  throw new ReplyError("You don't appear to be in a lobby here.");
    return lobby;
}

module.exports = {
    ReplyError,
    requireGuildMember,
    requireVoiceChannel
};