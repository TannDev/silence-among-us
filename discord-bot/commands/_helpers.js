const Lobby = require('../../classes/Lobby');

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
    if (!lobby) throw new Error("There's not a lobby for your voice channel. Start one with `!sau lobby start`!");

    return lobby;
}

module.exports = {
    requireGuildMember,
    requireTextChannel,
    requireVoiceChannel,
    requireLobby
};