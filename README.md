# Silence Among Us
A Discord bot designed to turn your server's voice channels into lobby for playing Among Us!

This project was inspired by Denver Quane's excellent [AmongUsDiscord](https://github.com/denverquane/amongusdiscord)
and leverages the same [AmongUsCapture](https://github.com/denverquane/amonguscapture) component to provide automation.

In fact, there's a great deal of cooperation between the developers of Silence Among Us and AmongUsDiscord!
If one bot doesn't suit your needs, check out the other one.

## Features
This bot turns your Discord voice channels into game lobbies for playing Among Us.

It's got a few features, so far:
- Tracks the status of players in the lobby, automatically or via simple commands.
- Automatically controls the server-mute and server-deafen settings for players in the voice channel.
- Automatically updates discord nicknames to match in-game names, when possible.
- Provides lobby updates via text channels, including the room code and the status of all players.
- Keeps the text channel clean, by removing commands and old lobby updates.

If there's another feature you'd really want, you can [request it](https://github.com/tanndev/silence-among-us/issues/new)!
Or, if you're a developer, maybe you can even [help us add it](CONTRIBUTING.md).

## Quickstart Guide
If you want to just jump in and get started, you can use our early-access hosted bot!

[Invite our bot](https://discord.com/api/oauth2/authorize?client_id=757007603149832203&permissions=150039808&scope=bot) to your discord server and get started right away! That authorization link contains all permissions that the bot needs (and some we expect it might need soon), though you may need to add the bot to any private channels you want to use for your games.

Once you've added the bot to your server, just type `!sau help` in any text channel to get started.

Being in early-access does come with some rough edges, so there're some things we'd like you to keep in mind:
- The bot might be a bit unstable, unreliable, or buggy. Help us improve it by [reporting issues](https://github.com/tanndev/silence-among-us/issues/new).
- Our hosted instance might go offline unexpectedly and without warning when we do upgrades or maintenance. We're working on [fixing this](https://github.com/tanndev/silence-among-us/issues/1).
- Discord rate-limits bots on a per-guild basis. So if you try to run more than one game at a time in your server, the bot might be slow to respond. If you've got a server where you run lots of games, [let us know](https://github.com/tanndev/silence-among-us/issues/new).

Of course, you can always [host your own instance of the bot](#host-your-own-bot) if you prefer.

## How It Works
The bot keeps track of multiple game "lobbies" at once, and controls the audio of each player in the lobby.

We're still working on more detailed documentation, but here's some basics to keep in mind:
- When you give the bot a command, it will use your current voice channel to find your lobby.
- Each game lobby connects to exactly one voice channel and exactly one text channel.
- A voice channel can only be used for one lobby at a time.
- A text channel can be used for multiple lobbies at the same time.
- When you start a lobby (`!sau lobby start`), that lobby will bind to the text channel where you issued the command. All lobby updates will go to that text channel, until the lobby ends. (Though you can still use other channels to issue commands, if you wish.)

### Game Integration
The bot supports [AmongUsCapture](https://github.com/denverquane/amonguscapture) for automating your lobbies!

When you start a new lobby, the bot will DM you a link to connect the capture app automatically.

It'll also provide a link for downloading a compatible version directly from the bot's server, if you need it. You can also find the exe in the [downloads](/downloads) folder, if you prefer. (You can get it directly from [the official releases](https://github.com/denverquane/amonguscapture/releases) as well, but we can't guarantee compatibility with other versions.) 

### Commands
When added to your app, the discord bot will automatically listen to every text channel it has access to.
To issue it commands, use `!sau <command>` or `!s<command>`.
Try starting with `!sau help` or `!s?`, to get a list of all the commands currently available.
Or use `!sau lobby start` (`!sl start`) to start a new lobby in your current channels.

### Lobby Phases
A lobby can be in one of three phases at any given time: "intermission", "working", and "meeting".
The bot will enforce different rules depending on the current phase of the lobby.

#### Intermission
The lobby enters the intermission phase whenever you're in the drop ship, between games. (This is also where the lobby starts when first created.)
- All players are marked as "Living"
- Everyone can both talk and hear.
- New players can join.

Start this phase manually with use `!sau intermission` or `!si`.

#### Working
The lobby enters the working phase whenever you start a new game or end a meeting.
- Players in the "living" or "dying" states are muted and deafened.
- Everyone else can talk freely, so the dead can communicate without needing the in-game chat.
- When a new player joins the lobby, they're set to "waiting" and unmuted accordingly.
- If a player is killed during this phase, they're marked as "dying" and stay muted and deafened. (To avoid spoilers via Discord.)

Start this phase manually with `!sau work` or `!sw`.

#### Meeting
The lobby enters the meeting phase whenever you start a new meeting.
- Any "dying" players immediately become "dead".
- "Living" players are unmuted and undeafened, so they can talk to each other.
- Everyone else is muted, but can still hear the discussion.
- If a player is killed during this phase, they're immediately set to "dead" and muted.

Start this phase manually with `!sau meet` or `!sm`.

## Host Your Own Bot
If you'd like to run your own dedicated bot, rather than rely on ours, you can easily host your own!

The bot runs via docker-compose and includes everything it needs in order to run.
First, though, you'll need to create a new Discord application and set up some environment variables.

### Create a Discord Application
Before you can run your own bot, you'll need to create a Discord application.
1. Go the [Discord Developer Portal](https://discord.com/developers/applications)
1. Create an account, if you don't have one already.
1. Click "New Application", pick a suitable name, and click "create".
1. Click "Bot" on the left side, next to the puzzle piece icon.
1. Click "Add Bot"
1. Copy the bot's token and save it **securely**. This is your `DISCORD_TOKEN` for later.
1. Click "OAuth2" on the left side, next to the wrench icon.
1. Under "Scopes", check "bot" and then the following bot permissions:
  - General Permissions: Manage Nicknames
  - General Permissions: View Channels
  - Text Permissions: Send Messages
  - Text Permissions: Manage Messages
  - Text Permissions: Embed Links
  - Voice Permissions: Connect
  - Voice Permissions: Speak
  - Voice Permissions: Mute Members
  - Voice Permissions: Deafen Members
1. Click "Copy" next to the URL generated under "Scopes".
1. Paste the link into the address bar of a new tab, to authorize your app for your server.
1. Take the bot token you generated earlier and configure your bot with the instructions below.

### Environment Variables
The bot uses a couple environment variables:
- `DISCORD_TOKEN`: The bot token for your Discord application
- `PORT`: Which port the API app should listen on. (Default: '8080')
- `HOST`: The hostname where the server is listening. (Default: 'localhost:${PORT}')
- `SECURE`: Whether the bot is available via HTTPS. (Default: 'false')

_Note:_ The server doesn't include SSL natively, but can be placed behind an appropriate proxy such as nginx.
In this case, set `PORT` to the _actual_ port used by the server, but set `HOST` and `SECURE` to their
externally-accessible values.

An easy way to provide this to the app is to create an `.env` file in the standard `VAR=value` format:
```
DISCORD_TOKEN=your-token-goes-here
HOST=sau.my-example-domain.com
PORT=8443
SECURE=true
```

### Run via Docker-Compose
If you have Docker-Compose, you can run the bot with a simple `docker-compose.yaml` file.

_Note:_ Unfortunately, we can't provide support for users that are unfamiliar with Docker or Docker Compose. 

```YAML
services:
  sau:
    container_name: sau-bot
    image: ghcr.io/tanndev/silence-among-us:latest
    environment:
        - DISCORD_TOKEN=YOUR TOKEN HERE
        - HOST=sau.EXAMPLEHOST.com
        - PORT=8080
        - SECURE=true
    ports:
      - 8080:8080
```

(See the [environment variables](#environment-variables) section above for details on setting the environment.)

### Where to Host
The easiest way to run the bot is by using Docker Desktop on your computer and connecting the capture app via localhost.

However, if you want an always-on solution -- or to allow other people to connect the capture app, then you'll need to host it somewhere else. We use a DigitalOcean droplet for the [early-access bot](https://sau.tanndev.com) and will include some helpful setup guides for that later.

## Contributing
If you'd like to contribute, check out our [Contributing Guidelines](CONTRIBUTING.md).

## Bundled Software
Versions of [Among Us Capture](https://github.com/denverquane/amonguscapture) are included under the terms of
the [MIT License](https://github.com/denverquane/amonguscapture/blob/2.0.7/LICENSE). Copyright (c) 2020 Denver Quane.