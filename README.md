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

## Installation
The bot is currently available only via Docker, and there's some setup required to make it work.

_Note:_ If you're unfamiliar with Docker, you'll need to wait for a future release. Unfortunately, TannDev can't provide introductory-level user support just yet.

If you **are** familiar with Docker, proceed as follows:
1. Create a new Discord application
    - _Instructions not yet available._
1. Start the bot via Docker.
    - The docker image is `jftanner/silence-among-us`
    - The bot uses two environment variables:
        - `PORT`: Which port the API server should listen on. (Default: 3000)
        - `DISCORD_TOKEN`: The bot token for your Discord application
    - If you want to use the API server, you'll need to expose or publish whichever port you selected.
1. Have fun!

## Develop or Build From Source
If you'd like to run the bot from source, you'll need a few things:
1. Prerequisites
    - Node.js (v12 or higher)
1. Clone the repository.
1. Install the dependencies with `npm install`
1. Create a `.env` file with your `DISCORD_TOKEN` in the standard `VAR=value` format.
1. Start everything with `npm start`, or run the bot without the API with `npm run bot`

If you'd like to contribute, check out our [Contributing Guidelines](CONTRIBUTING.md).
