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
- Provides lobby updates via text channels, including the room code.
- Keeps the text channel clean, by removing commands and old lobby updates.
- Supports multiple concurrent games, in different voice channels, at the same time.

## How It Works
The bot keeps track of multiple game "lobbies" at once, and controls the audio of each player in the lobby.

In lieu of more detailed documentation, here's some basics to keep in mind:
- When you give the bot a command, it will use your current voice channel to find your lobby.
- Each game lobby connects to exactly one voice channel and exactly one text channel.
- A voice channel can only be used for one lobby at a time.
- A text channel can be used for multiple lobbies at the same time.
- When you start a lobby (`!sau lobby start`), that lobby will bind to the text channel where you issued the command. All lobby updates will go to that text channel, until the lobby ends. (Though you can still use other channels to issue commands, if you wish.)

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

### Game Integration
The bot supports [AmongUsCapture](https://github.com/denverquane/amonguscapture) for automating your lobbies!

When you start a new lobby, the bot will DM you a link to connect the capture app automatically.
It'll also provide a link for downloading a compatible version, if you need it. 

## Running the Bot
If you want to use the bot, it'll need to be running somewhere.

Here's a few ways to make that happen...

### Request Access to the TannDev-Hosted Bot
We're working on rolling out a hosted bot that everyone can use!

It's still in early-access and available by invitation only.
If you want to use it, [please open an issue](https://github.com/tanndev/silence-among-us/issues/new).

You can also [host your own](#hosting-your-own)!

### Hosting Your Own
If you can't get access to an already-running bot, you can host your own.
You can do this via docker, or natively with Node.js.

Either way, though, you'll need to create a new Discord application for authorization.
You'll also need to provide some environment variable.

#### Create a Discord Application
Before you can run your own bot, you'll need to create a Discord application.
1. Go the [Discord Developer Portal](https://discord.com/developers/applications)
1. Create an account, if you don't have one already.
1. Click "New Application", pick a suitable name, and click "create".
1. Click "Bot" on the left side, next to the puzzle piece icon.
1. Click "Add Bot"
1. Copy the bot's token and save it **securely**. This is your `DISCORD_TOKEN` for later.
1. Under "Privileged Gateway Intents", enable the "Server Members Intent"
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

#### Environment Variables
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

#### Run via Docker-Compose
If you have Docker-Compose, you can run the bot with a simple `docker-compose.yaml` file.

_Note:_ Unfortunately, we can't provide support for users that are unfamiliar with Docker or Docker Compose. 

```YAML
services:
  sau:
    container_name: sau-bot
    image: jftanner/silence-among-us
    environment:
        - DISCORD_TOKEN=YOUR TOKEN HERE
        - HOST=sau.EXAMPLEHOST.com
        - PORT=8080
        - SECURE=true
    ports:
      - 8080:8080
```

(See the [environment variables](#environment-variables) section above for details on setting the environment.)

#### Run via Docker
_Note:_ Unfortunately, we can't provide support for users that are unfamiliar with Docker. 

If you're comfortable with Docker, here's what you need to know:
- The docker image is `jftanner/silence-among-us`
- Make sure to add the environment variables you need via the `-e` or `--env-file` parameters.
- If you want to use the API server or capture, you'll need to expose/publish whichever port you selected.

Here's a quick and dirty example, if you're running locally, and have a `.env` file:
`docker run -it --rm -p 3000:3000 --env-file=.env jftanner/silence-among-us`

#### Run via Node.js
_Note:_ Unfortunately, we can't provide support for users that are unfamiliar with running Node.js apps. 

If you're comfortable with Node.js, here's what you need to know:
- You'll need Node.js v12 or higher
- Clone or download the repo.
- Make sure the `.env` file is at the root of the project, next to `package.json`
- Start everything with `npm start`, or run the bot without the API with `npm run bot`

## Contributing
If you'd like to contribute, check out our [Contributing Guidelines](CONTRIBUTING.md).

## Bundled Software
Versions of [Among Us Capture](https://github.com/denverquane/amonguscapture) are included under the terms of
the [MIT License](https://github.com/denverquane/amonguscapture/blob/2.0.7/LICENSE). Copyright (c) 2020 Denver Quane.