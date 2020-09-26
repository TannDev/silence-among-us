const { MessageEmbed } = require('discord.js');
const Lobby = require('../../classes/Lobby');

class ReplyError extends Error {
    constructor(reply) {
        super();
        this.reply = reply;
    }
}

/**
 * If possible, deletes the given message.
 *
 * @param {Discord.Message} message
 * @returns {Promise<void>}
 */
async function deleteMessage(message) {
    if (message.deletable) await message.delete();
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
    const channel = await requireVoiceChannel(message);
    const lobby = await Lobby.find(channel);
    if (!lobby) throw new ReplyError("There's not a lobby for your voice channel. Start one with `start`!");

    return lobby;
}

/**
 * Create a message embed with information about the given lobby/
 * @param {Lobby} lobby
 * @param {object} [options]
 * @param {string} [options.title]
 * @param {string} [options.description]
 * @returns {module:"discord.js".MessageEmbed}
 */
function getLobbyInfoEmbed(lobby, options = {}) {
    return new MessageEmbed()
        .setTitle(options.title || 'Lobby Info')
        .setDescription(options.description || `Channel ID: ${lobby.channelId}`)
        .addField('Game State', lobby.state, true)
        .addField('Room Code', lobby.room || 'None', true)
        .addField('Players', "_Feature coming soon!_")
}

module.exports = {
    ReplyError,
    deleteMessage,
    requireGuildMember,
    requireVoiceChannel,
    requireLobby,
    getLobbyInfoEmbed
};