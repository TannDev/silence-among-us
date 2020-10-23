# Silence Among Us
![Guild Count Badge](https://img.shields.io/badge/dynamic/json?logo=discord&label=guilds&color=blue&query=$.guildsSupported&url=https://sau.tanndev.com/api/server)
![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/tanndev/silence-among-us?label=version&sort=semver)
![GitHub Release Date](https://img.shields.io/github/release-date/tanndev/silence-among-us)
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/tanndev/silence-among-us/Release/main?logo=github)
![Github Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/github/tanndev/silence-among-us)

A Discord bot to turn your server's voice channels into a lobby for playing Among Us!

## Features
This bot turns your Discord voice channels into game lobbies for playing Among Us.

It's got a few features, so far:
- Tracks the status of players in the game, [automatically](#game-integration) or via simple commands.
- Provides regular lobby updates via text channels, **including the room code** and the status of all players.
- Automatically controls the server-mute and server-deafen settings for players in the voice channel.
- Automatically updates Discord nicknames to match in-game names, when possible. (And back!)
- Keeps the text channel clean, by removing commands and old lobby updates.

If there's another feature you'd really want, you can [request it](https://github.com/tanndev/silence-among-us/issues/new)!

Or, if you're a developer, maybe you can even [help us add it](CONTRIBUTING.md).

## Quickstart Guide
If you want to just jump in and get started, you can use our early-access hosted bots!

[Invite our bot](https://discord.com/api/oauth2/authorize?client_id=757007603149832203&permissions=150039808&scope=bot) to your discord server and get started right away! That authorization link contains all permissions that the bot needs (and some we expect it might need soon), though you may need to add the bot to any private channels you want to use for your games.

Once you've added the bot to your server, just type `!sau help` in any text channel with the bot to get started.

Being in early-access does come with some rough edges, so there're some things we'd like you to keep in mind:
- The bot might be a bit unstable, unreliable, or buggy. Help us improve it by [reporting issues](https://github.com/tanndev/silence-among-us/issues/new).
- Our hosted instance might go offline unexpectedly and without warning when we do upgrades or maintenance. It _should_ recover where it left off.
- Discord rate-limits bots on a per-guild basis. So if you try to run more than one game at a time in your server, the bot might be slow to respond. If you've got a server where you run lots of games, [let us know](https://github.com/tanndev/silence-among-us/issues/new).

If none of that worries you, and you like to live on the cutting edge, you can [use the beta version](https://discord.com/api/oauth2/authorize?client_id=764878644341506068&permissions=149974272&scope=bot) instead. You could even use both at the same time, if you want. Though make sure you [configure the command prefix](#configure-prefix) of one of them to avoid conflicts. The beta will generally have the latest features, but at the cost of _much_ more frequent restarts and instability.

Of course, you can always [host your own instance of the bot](/docs/host-your-own-bot.md) if you prefer.

## Background
This project was inspired by Denver Quane's excellent [AmongUsDiscord](https://github.com/denverquane/amongusdiscord)
and leverages the same [AmongUsCapture](https://github.com/denverquane/amonguscapture) component to provide automation.

In fact, there's a great deal of cooperation between the developers of Silence Among Us and AmongUsDiscord!
If one bot doesn't suit your needs, check out the other one.

## How It Works
The bot keeps track of multiple game "lobbies" at once, and controls the audio of each player in the lobby.

We're still working on more detailed documentation, but here's some basics to keep in mind:
- When you give the bot a command, it will use your current voice channel to find your lobby.
- Each game lobby connects to exactly one voice channel and exactly one text channel.
- A voice channel can only be used for one lobby at a time.
- A text channel can be used for multiple lobbies at the same time.
- When you start a lobby (`!sau start`), that lobby will bind to the text channel where you issued the command. All lobby updates will go to that text channel, until the lobby ends. (Though you can still use other channels to issue commands, if you wish.)

### Game Integration
The bot supports [AmongUsCapture](https://github.com/denverquane/amonguscapture) for automating your lobbies!

When you start a new lobby, the bot will DM you a link to connect the capture app automatically.

It'll also provide a link for downloading a compatible version directly from the bot's server, if you need it. You can also find the exe in the [downloads](/downloads) folder, if you prefer. (You can get it directly from [the official releases](https://github.com/denverquane/amonguscapture/releases) as well, but we can't guarantee compatibility with other versions.) 

### Commands
When added to your app, the discord bot will automatically listen for commands in every text channel it has access to.
However, it'll only look for messages with a certain prefix to process commands.  By default, that prefix is `!sau` or `!s`.
The rest of this guide assumes that you are using the default settings, but just replace `!sau` with whatever your prefix is.

To issue commands to the bot, use `!sau <command>`.
Try starting with `!sau help` to get a list of all the commands currently available.
Or use `!sau start`to start a new lobby in your current channels.

If the bot is online but isn't responding to your commands, then it was probably [configured to use a different prefix](#configuration).
Fortunately, you can find out the current prefix setting for *all* the bots in your channel by typing `!sau-rollcall`.
Every SAU bot in the channel will respond with the list of prefixes that it's listening for in that channel.
(If you're running multiple bots, make sure you change them!)

### Lobby Phases
A lobby can be in one of three phases at any given time: "intermission", "working", and "meeting".
The bot will enforce different rules depending on the current phase of the lobby.

#### Intermission
The lobby enters the intermission phase whenever you're in the drop ship, between games. (This is also where the lobby starts when first created.)
- All players are marked as "Living"
- Everyone can both talk and hear.
- New players can join.

Start this phase manually with use `!sau intermission`.

#### Working
The lobby enters the working phase whenever you start a new game or end a meeting.
- Players in the "living" or "dying" states are muted and deafened.
- Everyone else can talk freely, so the dead can communicate without needing the in-game chat.
- When a new player joins the lobby, they're set to "waiting" and unmuted accordingly.
- If a player is killed during this phase, they're marked as "dying" and stay muted and deafened. (To avoid spoilers via Discord.)

Start this phase manually with `!sau work`.

#### Meeting
The lobby enters the meeting phase whenever you start a new meeting.
- Any "dying" players immediately become "dead".
- "Living" players are unmuted and undeafened, so they can talk to each other.
- Everyone else is muted, but can still hear the discussion.
- If a player is killed during this phase, they're immediately set to "dead" and muted.

Start this phase manually with `!sau meet`.

### Configuration
You can configure some settings on a per-server basis.

The `config` command will let you get, set, and reset options:
- `!sau config get <option>`: Get the current value of the option.
- `!sau config set <option> <value`: Set a new value for the option.
- `!sau config reset <option>`: Reset the value of the option back to the default.

Currently, the only configurable option is `prefix`, but this list will grow with future releases.

_Note:_ Each deployed instance of the bot uses a different settings database.

#### Prefix
(**Default:** `!sau|!s`)
The `prefix` option allows you to change which prefixes the bot listens to.

If you want to set multiple options, you can separate prefixes with spaces or `|`.

If you want to run multiple instances of the bot, you'll need to set each of them to listen on a different prefix. This can be tricky, if they're all in a channel together already. But it can be fixed:
1. First, add one of the instances to a private text channel without the others.
1. In that private channel, change its prefix with `!sau config set prefix <new prefixes>`.
1. Then, add the next bot to the private channel and change its prefix.
1. Repeat this as many times as needed to make all the instances different

To make test them, you can use `!sau-rollcall` in a channel with all of them, to make sure they have unique prefixes.

## Privacy
**Note:** This section only applies to the Tanndev-hosted instances of the bot.
It's an open-source project, so we can't control what other people choose to do with the code.
Unfortunately, that includes modifying it to try and steal your information.
Take caution when interacting with an instance of SAU that doesn't come from us.
 
In order to work properly, the bot needs to store some information about you:
- Your Discord user ID (hashed)
- The last in-game name you provided via `!sau join <name>`

As we add more features, we may need to store more information. However, we have a few policies:
- Your Discord ID is the only way we'll identify you. We'll never collect your real name or email address.
- We only care about the game. We won't store anything not directly related to Among Us, or your interaction with the bot.
- We'll never sell your information. To anyone. Ever.

### Right to Access Data
You can get a copy of all the information the bot knows about you by using the command `show-me` via DM or text channel.
(Of course, you need to use the appropriate command prefix if you send it in a channel.)

The bot will DM you with a record of everything it knows about you.

### Right to be Forgotten
If, at any time, you'd like the bot to forget everything it's ever recorded about you, it's really easy.

All you have to do is use the `forget-me` command via DM or text channel.
(Of course, you need to use the appropriate command prefix if you send it in a channel.)

## Contributing
If you'd like to contribute, check out our [Contributing Guidelines](CONTRIBUTING.md).

## Bundled Software
A version of [Among Us Capture](https://github.com/denverquane/amonguscapture) is included under the terms of
the [MIT License](https://github.com/denverquane/amonguscapture/blob/2.0.7/LICENSE). Copyright (c) 2020 Denver Quane.

This exact version will vary from time to time. It's usually an official release, but it'll occasionally be a custom build.
The current compatible version will be DMed to you when you start a new lobby and can be downloaded directly from the bot.