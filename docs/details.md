# Detailed Docs
If you're looking to know the nitty-gritty of how the bot works, then this is the document for you.

## Commands
When added to your Discord server, the bot will automatically listen for commands in every text channel it has access to.
However, it'll only look for messages with a certain prefix to process commands.  By default, that prefix is `!sau` or `!s`.
The rest of our documentation assumes that you are using the default settings, but just replace `!sau` with whatever your prefix is.

To issue commands to the bot, use `!sau <command>`.
Try starting with `!sau help` to get a list of all the commands currently available.
Or use `!sau start`to start a new lobby in your current channels.

If the bot is online but isn't responding to your commands, then it was probably [configured to use a different prefix](configuration.md#prefix).

Fortunately, you can find out the current prefix setting for *all* the bots in your channel by typing `!sau-rollcall`.
Every SAU bot in the channel will respond with the list of prefixes that it's listening for in that channel.
(If you're running multiple bots, make sure you change them!)

## Lobby Phases
A lobby can be in one of four phases at any given time: "Intermission", "Working", "Meeting", and "Menu".
The bot will enforce different rules depending on the current phase of the lobby.

### Intermission
The lobby enters the intermission phase whenever you're in the drop ship, between games. (This is also where the lobby starts when first created.)
- All players are marked as "Living"
- Everyone can both talk and hear.
- New players can join.

Start this phase manually with use `!sau intermission`.

### Working
The lobby enters the working phase whenever you start a new game or end a meeting.
- Players in the "living" or "dying" states are muted and deafened.
- Dead players can talk freely, so the dead can communicate without needing the in-game chat.
- Spectators are muted.
- When a new player joins the lobby, they're set to "waiting".
- If a player is killed during this phase, they're marked as "dying" and stay muted and deafened. (To avoid spoilers via Discord.)

Start this phase manually with `!sau work`.

### Meeting
The lobby enters the meeting phase whenever you start a new meeting.
- Any "dying" players immediately become "dead".
- "Living" players are unmuted and undeafened, so they can talk to each other.
- Everyone else is muted, but can still hear the discussion.
- If a player is killed during this phase, they're immediately set to "dead" and muted.

Start this phase manually with `!sau meet`.

### Menu
(_Automated lobbies only_)
The lobby enters the menu phase whenever capturing player is in the menu between games.

It's functionally identical to Intermission, except that the lobby's info posts omit certain game-specific information such as the room code and connected players.

This phase cannot be entered manually.