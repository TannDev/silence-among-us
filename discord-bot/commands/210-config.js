const Command = require('.');
const GuildConfig = require('../../classes/GuildConfig');

module.exports = new Command({
    aliases: ['config'],
    options: '<get|set|reset> <setting> [new value | reset]',
    description: 'Get or set configuration values. (See docs.)',
    category: 'more', // TODO Remove in lieu of custom docs.
    handler: async function() {
        // Load properties from the command context.
        const { message, arguments, prefix, alias } = this;
        const guild = await this.requireGuild();

        const [accessor, key, ...remainder] = arguments.trim().split(/\s+/g);
        const value = remainder?.join(' ');

        // Get the guild config.
        const guildConfig = await GuildConfig.load(guild.id);
        if (!guildConfig) throw new Error("I can't access the settings for this guild right now.")

        // Generate a command prefix for help texts.
        const cmd = `${prefix} ${alias} `;

        // Handle the command.
        switch (accessor?.toLowerCase()){
            // If the accessor is 'get'...
            case 'get':
            case 'g':
                if (!key) return message.reply(`You need to specify an option: \`${cmd}get <option>\``)
                const gotSetting = guildConfig.get(key);
                if (!gotSetting) await message.reply("There's no setting for that.")
                else await message.reply(`Current \`${key}\`setting: \`${gotSetting.toString()}\``);
                break;

            // If the accessor is 'set'...
            case 'set':
            case 's':
                if (!key) return message.reply(`You need to specify an option: \`${cmd}set <option> <value>\``)
                if (!value) throw new Error(`You need to specify a value: \`${cmd}set <option> <value>\``);
                const setSetting = guildConfig.set(key, value);
                await message.reply(`Updated \`${key}\`setting: \`${setSetting.toString()}\``);
                break;

            // If the accessor is 'reset'...
            case 'reset':
            case 'delete':
            case 'r':
                if (!key) return message.reply(`You need to specify an option: \`${cmd}reset <option>\``)
                const resSetting = guildConfig.reset(key);
                await message.reply(`Reset \`${key}\`setting: \`${resSetting.toString()}\``);
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