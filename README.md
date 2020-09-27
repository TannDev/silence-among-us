# Silence Among Us
This is a work-in-progress still under active development.

**If you're looking for something you can use right now**, try [amongusdiscord](https://github.com/denverquane/amongusdiscord) instead.

## Features
This bot turns your Discord voice channels into game lobbies for playing Among Us.

It's got a few features, so far:
- Tracks the status of players in the lobby, via simple commands.
- Automatically controls the server-mute and server-deafen settings for players in the voice channel.
- Provides lobby updates via text channels, including the room code.
- Keeps the text channel clean, by removing commands and old lobby updates.
- Supports multiple concurrent games, in different voice channels, at the same time.
- Automatically adds players to a lobby as they join the channel.

## How It Works
The bot keeps track of multiple game "lobbies" at once, and controls the audio of each player in the lobby.

In leu of more detailed documentation, here's some basics to keep in mind:
- When you make any other commands, the bot will use your current voice channel to find your lobby.
- Each game lobby connects to exactly one voice channel and exactly one text channel.
- A voice channel can only be used for one lobby at a time.
- A text channel can be used for multiple lobbies at the same time.
- When you start a lobby (`!sau lobby start`), that lobby will bind to the text channel where you issued the command. All lobby updates will go to that text channel, until the lobby ends. (Though you can still use other channels to issue commands, if you wish.)

### Commands
When added to your server, the discord bot will automatically listen to every text channel it has access to.
To issue it commands, use `!sau <command>` or `!s<command>`.
Try starting with `!sau help` or `!s?`, to get a list of all the commands currently available.

### Lobby Phases
A lobby can be in one of three phases at any given time: "intermission", "working", and "meeting".
The bot will enforce different rules depending on the current phase of the lobby.

#### Intermission
You should put your lobby into the "intermission" phase (use `!sau intermission` or `!si`) whenever you're in the drop ship, between games. (This is also where the lobby starts when first created.)
- All players are marked as "Living"
- Everyone can both talk and hear.
- New players can join.

#### Working
You should put your lobby into the "working" phase (use `!sau work` or `!sw`) whenever you start a new game or end a meeting.
- Players in the "living" or "dying" states are muted and deafened.
- Everyone else can talk freely, so the dead can communicate without needing the in-game chat.
- When a new player joins the lobby, they're set to "waiting" and unmuted accordingly.
- If a player is killed during this phase, they're marked as "dying" and stay muted and deafened. (To avoid spoilers via Discord.)

#### Meeting
You should put your lobby into the "meeting" phase (use `!sau meet` or `!sm`) whenever you start a new meeting.
- Any "dying" players immediately become "dead".
- "Living" players are unmuted and undeafened, so they can talk to each other.
- Everyone else is muted, but can still hear the discussion.
- If a player is killed during this phase, they're immediately set to "dead" and muted.

### Game Integration
Unfortunately, there's no direct connection to the game at the moment. So you'll need to use discord commands (or the API) to change the game phase, kill players, etc.

... for now!

## Running the Bot
If you want to use the bot, it'll need to be running somewhere.

Here's a few ways to make that happen...

### Using the TannDev-Hosted Bot
Unfortunately, we don't have the CPU or bandwidth to provide the bot to everybody and have to be very stingy with access to the deployment we use for testing. If you know someone from TannDev personally, you can reach out to them directly. Otherwise, you'll need to host your own or wait for a larger launch.

### Hosting Your Own
If you can't get access to an already-running bot, you can host your own.
You can do this via docker, or natively with Node.js.

Either way, though, you'll need to create a new Discord application for authorization.
You'll also need to provide some environment variable.

#### Create a Discord Application
_Instructions not yet available._

#### Environment Variables
The bot uses a couple environment variables:
- `PORT`: Which port the API server should listen on. (Default: 3000)
- `DISCORD_TOKEN`: The bot token for your Discord application

The easiest way to store these is to create `.env` file in the standard `VAR=value` format:
```
PORT=3000
DISCORD_TOKEN=your-token-goes-here
```

#### Run via Docker
_Note:_ Unfortunately, we can't provide support for users that are unfamiliar with Docker. 

If you're comfortable with Docker, here's what you need to know:
- The docker image is `jftanner/silence-among-us`
- Make sure to add the environment variables via `-e DISCORD_TOKEN=your-token` or with the `.env` file.
- If you want to use the API server, you'll need to expose or publish whichever port you selected.

Here's a quick and dirty example, if you're running locally:
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
