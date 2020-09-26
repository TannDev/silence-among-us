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
        if (error.reply) await message.reply(error.reply);
        else {
            console.error(error);
            await message.reply("Something went wrong.");
        }
    });
});

client.on('messageUpdate', (oldMessage, newMessage) => {
    // TODO Consider handling message updates to allow commands to be fixed.
});

client.on('presenceUpdate', (oldPresence, newPresence) => {
    // TODO Say hello
    // logItem('newPresence', newPresence);
});

// Connect to Discord.
console.log('Launching Discord bot...');
client.login().catch(error => {
    console.log('Could not log in.');
    console.error(error);
    process.exit(1);
});