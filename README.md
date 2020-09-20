# Silence Among Us
This is a work-in-progress and not ready testing yet.

**If you're looking for something you can use right now**, try [amongusdiscord](https://github.com/denverquane/amongusdiscord) instead.

## Goals
The following documentation represents that current goal of the project. Each of these features may or may not be implemented yet.

### Bot Commands
These are the current plans for bot commands:
- `help|h|?`: Print some help text.
- `join`: Start a new lobby using your current voice channel.
- `leave`: End your lobby.
- `room|r [room code] [region]`: Get (or set) the room information of your lobby.
- `intermission|i`: Mark your lobby as being in intermission. (End a game.)
- `working|work|w`: Mark your lobby as working on tasks. (Start a game, or end a meeting.)
- `meeting|meet|m`: Mark your lobby as being in a meeting.
- `dead|kill|d|k <@mentions...>`: Mark the at-mentioned players as being dead.
- `revive <@mentions...>`: Mark any at-mentioned players as being alive. (For fixing mistakes with `dead`.)

### General Structure
The central data model of the app is a `Lobby`. This consists of two main elements: a Discord channel and a game state. These are inextricably linked, as multiple games can't happen in the same channel (without enormous confusion), and the bot shouldn't mute/unmute people without a game in session.

Pending a proper specification, the general model will look something like this:
```YAML
state: The current lobby state. (`intermission`, `working`, `meeting)
roomCode: (Optional) The room code to help players join
roomRegion: (Optional) the region where the room is running
discord:
  guild: The uuid of the guild (aka server) to be tracked
  textChannel: The uuid of the text channel for the bot to communicate
  voiceChannel: The uuid of the voice channel that players will use for the game
  auth: Whatever authentication is required to talk to the server (TBD)
players:
  - discordId: The player's unique ID in discord (for mute/unmute)
    status: Current status of the player. (`living`, `dead`, `spectating`)
    amongUsName: (Optional) The player's name in-game
    amongUsColor: (Optional) Thecolor of the player in-game
```

As players join the discord channel, they should be automatically added to the lobby.
   
### Lobby States
There are three states a lobby can be in: `intermission`, `working`, and `meeting`. These affect whether players should be muted/deafened, as well as what status players have when they join.

The following table describes each state, when it occurs, what rules it enforces, and what happens when transitioning to that state.

| State      | Intermission                                  | Working                                                       | Meeting                                                     |
|------------|-----------------------------------------------|---------------------------------------------------------------|-------------------------------------------------------------|
| When       | Between games                                 | In game, while doing tasks                                    | In game, during meetings                                    |
| Rules      | - Everyone can talk<br>- New players can join | - _Living_ players are mute+deaf<br>- _Dead_ players can talk | - _Living_ players can talk<br>- _Dead_ players are mute    |
| Transition | - Unmute/Undeafen _all_ players               | - Mute/Deafen _living_ players<br>- Unmute _dead_ players     | - Mute _dead_ players<br>- Unmute/Undeafen _living_ players |

**Notes:**
- Dead players muted first and unmuted last, to avoid living players accidentally hearing them during a transition.
- When a player is marked as killed, they are immediately undeafened and muted/unmuted according to the current state of the lobby.

### Commands
The service should accept the following commands:
- **Set Room**: Update the room code and region
- **Transition**: Transition into a new state: `intermission`, `working`, or `meeting`.
- **Start Working**: Transition into the `working` state.
- **Start Meeting**: Transition into the `meeting` state.
- **End Game**
