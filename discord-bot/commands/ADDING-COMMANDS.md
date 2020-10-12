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
const { Command, requireGuildMember } = require('.');

module.exports = new Command({
    aliases: ['echo', 'e'],
    options: '<text>',
    description: 'Have the bot repeat your words back to you'
    handler: async (message, arguments) => {
        const guildMember = await requireGuildMember(message); 
        const echo = arguments ? `You said "${arguments}"` : "You didn't say anything, though.";
        await guildMember.send(`Hi! I got your message. ${echo}`);
    }
});
```

## Properties of a Command
When creating a command, there are several properties to define:
- `{String} aliases` - (Required) An array of aliases for the command. Each alias **must** be unique and not match any existing alias for another command.
- `{Function(message, arguments): Promise<void>} handler` - (Required) The function which will execute the command. 
- `{String} options` - A description of any arguments to be expected. (Use the standard `<required> [optional]` format for these.)
- `{String} description` - A description to show users in the help text. If omitted, the command won't be included in help listings.
- `{String} category` - Which section of the help to list the command. Should be one of `meta`, `core`, `more`, `manual`. If omitted, the command won't be included in the help listings.

## The Handler
The handler function does the actual work. Here're some tips:
- Use the `async` keyword with an arrow function, to always return a promise and keep things tidy.
- The parameters for your handler **must** be `(message, arguments)`.
- The `message` parameter will always be a `Discord.Message` instance from DiscordJS.
- The `arguments` parameter is optional, and will always be a (possibly empty) string.
- Any return value will be ignored, but errors will be caught and logged.

## Helper Functions
When writing your handler, feel free to use any of the helper functions from the index.

These helpers handle common expectations that commands might have. For example, lots of commands can only be run against an already-existing lobby, so the `requireLobby` helper checks to make sure such a lobby exists and returns it to you if it does.

Each of the helpers is an async function which accepts the `message` parameter passed into your handler.
They will enforce the specified condition (throwing a friendly error if it's not met) and return the specified object. Here's the complete list:
- `requireGuildMember`: Requires that message comes from a guild text channel. Returns the author as a `Discord.GuildMember`.
- `requireTextChannel`: Requires that the message was sent via a guild's text channel. Returns the channel as a `Discord.TextChannel`.
- `requireVoiceChannel`: Requires that the message author is in a voice channel in the same guild as the message. Returns the channel as a `Discord.VoiceChannel`.
- `requireLobby`: Requires that the message author have a lobby associated with their current voice channel. Returns that lobby as a `Lobby`.