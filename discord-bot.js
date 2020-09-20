require("dotenv").config();
const Discord = require('discord.js');

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
    console.log(`Logged in as ${client.user.tag}!`);
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
    logItem('Voice state update', { oldState, newState });
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
    processMessage(message).catch(error => console.error('Bot Error:', error));
});

client.on('messageUpdate', (oldMessage, newMessage) => {
    // TODO Consider handling message updates to allow commands to be fixed.
});

client.on('presenceUpdate', (oldPresence, newPresence) => {
    // TODO Say hello
    // logItem('newPresence', newPresence);
});

console.log('Launching Discord bot...');
client.login()
    .catch(error => {
        console.log('Could not log in.');
        console.error(error);
        process.exit(1);
    });

async function processMessage(message){
    const commandPattern = /^!s?au\s+(?<command>[^\s]+)(?:\s+(?<arguments>.+))?$/i;
    // Look for commands.
    const parsed = message.content.match(commandPattern);
    if (!parsed) return;
    const {groups: {command, arguments}} = parsed;

    // Erase commands
    message.delete();

    // TODO Find the lobby that the player is in.

    // Provide help.
    if (command.match(/^(?:help|h)$/i)) {
        // TODO Use a proper command handler, rather than coding this separately.
        const reply = [
            'You can use any of the following commands: (Use `!sau [command]`)',
            '`help` | `h`: Display this help text.',
            '`game` | `g`: _Coming soon_.'
        ].join('\n\t- ')
        await message.reply(reply);
        return;
    }

    // Accept hellos.
    if (command.match(/^(?:hi|hello|he+y+)$/i)) {
        await message.reply('Hello!')
        return;
    }

    // Accept game commands.
    if (command.match(/^(?:game|g)$/i)){
        // TODO Follow instructions.
        await message.reply("I recognize the `game` command, but I can't do anything yet.");
        return;
    }

    // If the command wasn't handled by now, respond as unrecognized.
    await message.reply(`Sorry, I don't recognize that command (\`${command}\`. Try \`!sau help\`.`)
}

// Helper function TODO Remove this
function logItem(name, value) {
    console.log(`${name}:\n${JSON.stringify(value, null, 2)}`);
}