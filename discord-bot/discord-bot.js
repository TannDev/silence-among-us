require("dotenv").config();
const Discord = require('discord.js');

const processCommandMessage = require('./commands');

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

client.on('ready', () => {
    console.log(`Discord bot logged in as ${client.user.tag}`);
});

client.on('error', (error) => {
    console.error('Bot Error:', error);
});

client.on('warn', (info) => {
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

client.on('voiceStateUpdate', (oldState, newState) => {
    const joinExample = {
        "oldState": {
            "guild": "174316320949534720",
            "id": "173476112972775424",
            "streaming": false
        },
        "newState": {
            "guild": "174316320949534720",
            "id": "173476112972775424",
            "serverDeaf": false,
            "serverMute": false,
            "selfDeaf": false,
            "selfMute": false,
            "selfVideo": false,
            "sessionID": "5194b317be46349e4d9af663412d04e3",
            "streaming": false,
            "channel": "757021452435325049"
        }
    };
    const leaveExample = {
        "oldState": {
            "guild": "174316320949534720",
            "id": "173476112972775424",
            "serverDeaf": false,
            "serverMute": false,
            "selfDeaf": false,
            "selfMute": false,
            "selfVideo": false,
            "sessionID": "5194b317be46349e4d9af663412d04e3",
            "streaming": false,
            "channel": "757021452435325049"
        },
        "newState": {
            "guild": "174316320949534720",
            "id": "173476112972775424",
            "serverDeaf": false,
            "serverMute": false,
            "selfDeaf": false,
            "selfMute": false,
            "selfVideo": false,
            "sessionID": "5194b317be46349e4d9af663412d04e3",
            "streaming": false,
            "channel": null
        }
    };

});

client.on('message', (message) => {
    if (message.content === '!debug'){
        console.log(client.voice.connections);
    }
})

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
client.login()
    .catch(error => {
        console.log('Could not log in.');
        console.error(error);
        process.exit(1);
    });

// If Node is about to exit, try to log out.
process.on('exit', () => {
    require('deasync')(client.destroy());
});