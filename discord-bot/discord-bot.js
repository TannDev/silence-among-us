require("dotenv").config();
const Discord = require('discord.js');
/*
 * NOTE: To avoid circular references causing null imports, other classes should be required AFTER
 * the client is configured and exported. This way, those classes will be able to require this
 * module and access the client.
 */

// Configure and export client.
const client = new Discord.Client({
    token: process.env.DISCORD_TOKEN,
    retryLimit: 3,
    presence: {
        activity: {
            name: '`!sau help`',
            type: 'LISTENING'
        }
    }
});
module.exports = client;

// ==== It's now safe to require other modules. ====

const processCommandMessage = require('./commands');
const Lobby = require('../classes/Lobby')

client.on('ready', () => {
    console.log(`Discord bot logged in as ${client.user.tag}`);
});

client.on('error', (error) => {
    // TODO Use a better logger.
    console.error('Bot Error:', error);
});

client.on('warn', (info) => {
    // TODO Use a better logger.
    console.warn('Bot warning:', info);
});

client.on('invalidated', () => {
    console.error('(FATAL) Session was invalidated.');
    process.exit(1);
});

client.on('rateLimit', (rateLimitInfo) => {
    console.error('Rate Limited:', rateLimitInfo);
    // TODO Identify and retry the failed command.
});

client.on('message', (message) => {
    processCommandMessage(message).catch(async error => {
        console.error(error);
        await message.reply(error.message || "Something went wrong.");
    });
});

client.on('messageUpdate', (oldMessage, newMessage) => {
    // TODO Consider handling message updates to allow commands to be fixed.
});

client.on('voiceStateUpdate', async (oldPresence, newPresence) => {
    // TODO Find a better file for this to live in.
    // Track players as they move from channel to channel.
    const {channelID: oldChannelId} = oldPresence;
    const {channelID: newChannelId, member} = newPresence;

    // Ignore bots and any updates that don't involve changing channels.
    if (member.user.bot || oldChannelId === newChannelId) return;

    // Determine if a player is joining/leaving a game.
    const [oldLobby, newLobby] = await Promise.all([
        Lobby.findByVoiceChannel(oldChannelId),
        Lobby.findByVoiceChannel(newChannelId)
    ]);

    // If they're going into a new lobby, add or reconnect them.
    if (newLobby) await newLobby.connectPlayer(member);

    // Otherwise, if they're leaving an old lobby, but are still in a voice channel, unmute them.
    else if (oldLobby && newChannelId) {
        const {voice} = member;
        if (!voice) return;
        const reason = `Silence Among Us: Left Lobby`
        await Promise.all([voice.setMute(false, reason), voice.setDeaf(false, reason)]);
    }
});

// Connect to Discord.
console.log('Launching Discord bot...');
client.login().catch(error => {
    console.log('Could not log in.');
    console.error(error);
    process.exit(1);
});