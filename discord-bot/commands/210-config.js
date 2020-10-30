const { MessageEmbed } = require('discord.js');
const Command = require('.');
const GuildConfig = require('../../classes/GuildConfig');

module.exports = new Command({
    aliases: ['server-config', 'guild-config', 'config'],
    description: 'Adjust how the bot works in this server.',
    category: 'more',
    handler: async function () {
        // Load properties from the command context.
        const { message, arguments, prefix, alias } = this;
        const guild = await this.requireGuild();

        const [accessor, key, ...remainder] = arguments.trim().split(/\s+/g);
        const value = remainder?.join(' ');

        // Get the guild config.
        const guildConfig = await GuildConfig.load(guild.id);
        if (!guildConfig) throw new Error("I can't access the settings for this guild right now.");

        // Generate a command prefix for help texts.
        const cmd = `${prefix} ${alias} `;

        // Handle the command.
        switch (accessor?.toLowerCase()) {
            // If there's no accessor...
            case undefined:
            case '':
                // Create an embed.
                const embed = new MessageEmbed()
                    .setTitle('Silence Among Us - Server Configuration')
                    .setDescription([
                        `\`${cmd}get <option>\`: Find out what an options is currently to.`,
                        `\`${cmd}set <option> <value>\`: Update an option with a new value.`,
                        `\`${cmd}reset <option>\`: Reset an option to the default value.`
                    ].join('\n'));

                // Add a field for all parameters.
                Object.entries(GuildConfig.SETTINGS).map(([key, { defaultValue, options, description }]) => {
                    if (!description) return;
                    const meta = [];
                    if (defaultValue) meta.push(`_Default:_ \`${defaultValue}\``);
                    if (options) meta.push(`_Options:_ ${options.map(option => `\`${option}\``).join(', ')}`);
                    embed.addField(key, `${meta.join('; ')}\n${description}`.trim());
                });

                // Send the embed.
                await message.channel.send(embed);
                break;

            // If the accessor is 'get'...
            case 'get':
            case 'g':
                if (!key) return message.reply(`You need to specify an option: \`${cmd}get <option>\``);
                if (!GuildConfig.SETTINGS[key]) await message.reply("There's no setting for that.");
                const gotSetting = guildConfig.get(key);
                const defaultDisplay = guildConfig.usesDefault(key) ? ' (Default)' : '';
                await message.reply(`Current \`${key}\` setting: \`${gotSetting.toString()}\`${defaultDisplay}`);
                break;

            // If the accessor is 'set'...
            case 'set':
            case 's':
                if (!key) return message.reply(`You need to specify an option: \`${cmd}set <option> <value>\``);
                if (!value) throw new Error(`You need to specify a value: \`${cmd}set <option> <value>\``);
                if (!GuildConfig.SETTINGS[key]) await message.reply("There's no setting for that.");
                const setSetting = guildConfig.set(key, value);
                await message.reply(`Updated \`${key}\` setting: \`${setSetting.toString()}\``);
                break;

            // If the accessor is 'reset'...
            case 'reset':
            case 'delete':
            case 'r':
                if (!key) return message.reply(`You need to specify an option: \`${cmd}reset <option>\``);
                if (!GuildConfig.SETTINGS[key]) await message.reply("There's no setting for that.");
                const resSetting = guildConfig.reset(key);
                await message.reply(`Reset \`${key}\` setting: \`${resSetting.toString()}\` (Default)`);
                break;

            // If the accessor is something else (or missing).
            default:
                await message.reply([
                    'You need to use one of these:',
                    `Get an option: \`${cmd}get <option>\``,
                    `Set an option: \`${cmd}set <option> <value>\``,
                    `Reset an option: \`${cmd}reset <option>\`.`
                ].join('\n\t'));
        }
    }
});