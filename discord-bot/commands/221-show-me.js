const Command = require('.');
const Lobby = require('../../classes/Lobby');
const UserConfig = require('../../classes/UserConfig');

module.exports = new Command({
    aliases: ['show-me'],
    description: 'Get a copy of all information the bot has about you.',
    handler: async function () {
        // Load properties from the command context.
        const { message } = this;

        // Tell the user we're looking.
        await message.author.send("You've requested a copy of everything I know about you. I'll take a look!");

        // Gather data.
        const discordId = message.author.id;
        const dataElements = [];
        const [userConfigCheck, lobbyCheck] = await Promise.allSettled([
            UserConfig.load(discordId),
            Lobby.gatherUserData(discordId)
            // Add more data sources here.
        ]);
        if (userConfigCheck.value?.isSaved) dataElements.push({
            source: 'Your `UserConfig` Record',
            data: userConfigCheck.value.toJSON()
        });
        if (lobbyCheck.value?.length) lobbyCheck.value.forEach(entry => dataElements.push({
            source: 'An ongoing lobby',
            data: entry
        }));
        // Process more data sources here.

        // Format the data.
        const dataReport = dataElements.map(element => {
            if (typeof element === 'string') return `\`${element}\``;
            const { source, data } = element;
            return `\`\`\`JSON\n${source}:\n${JSON.stringify(data, null, 2)}\n\`\`\``;
        });

        // Send the data.
        if (dataReport.length) {
            await message.author.send("Okay, here's everything I found...");
            await Promise.all(dataReport.map(entry => message.author.send(`\n\n${entry}`)));
        }
        else await message.author.send("It looks like I don't know know anything about you.");

    }
});