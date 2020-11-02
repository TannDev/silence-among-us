# Silence Among Us
![Guild Count Badge](https://img.shields.io/badge/dynamic/json?logo=discord&label=guilds&color=blue&query=$.guildsSupported&url=https://sau.tanndev.com/api/server)
![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/tanndev/silence-among-us?label=version&sort=semver)
![GitHub Release Date](https://img.shields.io/github/release-date/tanndev/silence-among-us)
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/tanndev/silence-among-us/Release/main?logo=github)

Turn your Discord server's voice channels into lobbies for playing Among Us!

## Features
- Tracks the status of players in the game, [automatically](#automated-lobbies) or via simple commands.
- Provides regular lobby updates via text channels, **including the room code** and the status of all players.
- Automatically controls the server-mute and server-deafen settings for players in the voice channel.
- Automatically updates Discord nicknames to match in-game names, when possible. (And back!)
- Keeps the text channel clean, by removing commands and old lobby updates.
- Auto-joins returning players with the same in-game name. (No more `!sau join`!)

If there's another feature you'd really want, you can [request it](https://github.com/tanndev/silence-among-us/issues/new)!

Or, if you're a developer, maybe you can even [help us add it](CONTRIBUTING.md).

## Quickstart Guide
**[Invite our verified bot](https://discord.com/api/oauth2/authorize?client_id=757007603149832203&permissions=150039808&scope=bot) to your discord server and get started right away!** That authorization link contains all permissions that the bot needs (and some we expect it might need soon), though you may need to add the bot to any private channels you want to use for your games.

Once you've added the bot to your server, just type `!sau help` in any text channel with the bot to get started.

Here's a couple things we'd like you to keep in mind.
- There are probably some bugs kicking around. Help us improve the bot by [reporting issues](https://github.com/tanndev/silence-among-us/issues/new).
- Discord rate-limits bots on a per-guild basis. So if you try to run more than one game at a time in your server, the bot might be slow to respond. If you've got a server where you run lots of games, [let us know](https://github.com/tanndev/silence-among-us/issues/new).

If you like to live on the cutting edge, you can [use the beta version](https://discord.com/api/oauth2/authorize?client_id=764878644341506068&permissions=149974272&scope=bot) instead. You could even use both at the same time, if you want. (Though you'll need to [configure the command prefix](docs/configuration.md#prefix) of one of them to avoid conflicts.) The beta will generally have the latest features, but at the cost of more frequent restarts and instability.

Of course, you can always [host your own instance of the bot](/docs/self-hosting.md#host-your-own-bot) if you prefer.

### How It Works
The bot keeps track of multiple game "lobbies" at once, and controls the audio of each player in the lobby.

We've got [a detailed guide](docs/details.md#detailed-docs), but here are the basics:
- When you give the bot a command, it will use your current voice channel to find your lobby.
- A voice channel can only be used for one lobby at a time.
- A text channel can be used for multiple lobbies at the same time.
- When you start a lobby (`!sau start`), that lobby will bind to the text channel where you issued the command. All lobby updates will go to that text channel, until the lobby ends. (Though you can still use other channels to issue commands, if you wish.)

You can also configure the bot to suit your server's needs.
Check out our [configuration guide](/docs/configuration.md#per-server-configuration) for details on that.

### Automated Lobbies
The bot supports [AmongUsCapture](https://github.com/denverquane/amonguscapture) for automating your lobbies!

When you start a new lobby, the bot will DM you a link to connect the capture app automatically.

It'll also provide a link for downloading a compatible version from Github, if you need it.
Alternatively, can also get it directly from [the official releases](https://github.com/denverquane/amonguscapture/releases) instead.
(Though we can't guarantee compatibility with other versions.)

### Privacy
In order to work correctly, the bot needs to collect some user information.

We try to limit this data as much as possible, but you can read our [privacy policy](docs/privacy.md#privacy-policy) for details.

## Background
This project was inspired by Denver Quane's excellent [AutoMuteUs](https://github.com/denverquane/amongusdiscord)
and leverages the same [AmongUsCapture](https://github.com/denverquane/amonguscapture) component to provide automation.

In fact, there's a great deal of cooperation between the developers of Silence Among Us and AutoMuteUs!
If one bot doesn't suit your needs, check out the other one.

## Contributing
If you'd like to contribute, check out our [Contributing Guidelines](CONTRIBUTING.md).
