# How to Add New Commands
The bot will automatically load all commands from the [commands directory](/discord-bot/commands) directory on startup. So adding new commands is as simple as adding a new file to the directory, with the appropriate structure.

## Naming Convention
Each command should live in a dedicated file. The name of this file should follow the existing pattern:
`<sorting number>-<first alias>.js`.

The `sorting number` is used to order the file in the directory, and in the help text.
- Numbers `0xx` are reserved for meta commands. `help`, `stats`, etc.
- Numbers `1xx` are reserved for commands in the `core` category.
- Numbers `2xx` are reserved for commands in the `more` category.
- Numbers `3xx` are reserved for commands in the `manual` category.
- Numbers `9xx` are reserved for unpublished commands.

## Example
Here's an example of what a command file might look like:
```Javascript
const Command = require('.');

module.exports = new Command({
    aliases: ['echo', 'e'],
    options: '<text>',
    description: 'Have the bot repeat your words back to you'
    handler: async function() {
        // Load properties from the command context.
        const { arguments } = this;
        const guildMember = await this.requireGuildMember();

        // Echo back to the user.
        const echo = arguments ? `You said "${arguments}"` : "You didn't say anything, though.";
        await guildMember.send(`Hi! I got your message. ${echo}`);
    }
});
```

## Properties of a Command
When creating a command, there are several properties to define:
- `{String} aliases` - (Required) An array of aliases for the command. Each alias **must** be unique and not match any existing alias for another command.
- `{Function(message, parameters): Promise<void>} handler` - (Required) The function which will execute the command. 
- `{String} options` - A description of any arguments to be expected. (Use the standard `<required> [optional]` format for these.)
- `{String} description` - A description to show users in the help text. If omitted, the command won't be included in help listings.
- `{String} category` - Which section of the help to list the command. Should be one of `meta`, `core`, `more`, `manual`. If omitted, the command won't be included in the help listings.

## The Handler
The handler function does the actual work. Here're some tips:
- Use the `async` keyword to always return a promise.
- Do **not** use arrow functions, or you won't have access to the command context.
- When executed, `this` will be bound to a command context with everything you need. 
- Don't use decomposition (`const { requireGuildMember } = this;`) for helper methods.
- Any return value will be ignored, but errors will be caught and logged.

### The Command Context
When the command processor executes your handler, it will bind `this` a command context.

This context has the following properties:
- The `this.message` is a `Discord.Message` instance with the original message.
- The `this.prefix` is a string containing the command prefix used by the user.
- The `this.alias` is a string containing the command alias used by the user.
- The `this.arguments` is a string containing any arguments provided by the user.

The command context also includes a number of methods to handle expectations that your command might have. For example, lots of commands can only be run against an already-existing lobby, so the `requireLobby` helper checks to make sure such a lobby exists and returns it to you if it does.

Each helper will enforce the specified condition (throwing a friendly error if it's not met) and return the specified object.

Here's the complete list:
- `this.requireGuild()`: Requires that message comes from a guild text channel. Returns the guild as a `Discord.Guild`.
- `this.requireGuildMember()`: Requires that message comes from a guild text channel. Returns the author as a `Discord.GuildMember`.
- `this.requireTextChannel()`: Requires that the message comes from a guild's text channel. Returns the channel as a `Discord.TextChannel`.
- `this.requireVoiceChannel()`: Requires that the message author is in a voice channel in the same guild as the message. Returns the channel as a `Discord.VoiceChannel`.
- `this.requireLobby()`: Requires that the message author have a lobby associated with their current voice channel. Returns that lobby as a `Lobby`.