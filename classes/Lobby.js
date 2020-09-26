const Room = require('./Room');

/**
 * Maps channel IDs to lobbies.
 * @type {Map<string, Lobby>}
 */
const channelLobbies = new Map();

// TODO Store lobbies somewhere outside of memory.

/**
 * @property {string} channelId - Id of the voice channel associated with the lobby.
 * @property {string} state - Current state of the lobby
 */
class Lobby {
    /**
     * Create a new lobby for a channel.
     *
     * @param {string|Discord.VoiceChannel} channel - Voice channel, or channel ID.
     * @returns {Promise<Lobby>}
     */
    static async start(channel) {
        if (typeof channel === 'string'){
            // TODO Get the voice channel associated with the ID.
            throw new Error("Starting a channel by ID isn't supported yet.");
        }

        const channelId = channel.id;

        // TODO Add starting players.

        const lobby = new Lobby({channelId, state: 'intermission', voiceChannel: channel});
        channelLobbies.set(channelId, lobby);
        lobby.emit("Created")

        // TODO Save to database.

        return lobby;
    }

    /**
     * Find a lobby associated with a channel id.
     *
     * @param {string|Discord.VoiceChannel} channel - Voice channel, or channel ID.
     * @returns {Promise<Lobby>} - Lobby matching the channel, or null
     */
    static async find(channel) {
        if (!channel) return null;
        if (typeof channel === 'string'){
            // TODO Get the voice channel associated with the ID.
            throw new Error("Finding a channel by ID isn't supported yet.");
        }

        // TODO Load from database.

        const lobby = channelLobbies.get(channel.id);
        if (lobby) lobby.voiceChannel = channel;
        return lobby;
    }

    constructor({ channelId, state, players, room }) {
        if (!channelId || typeof channelId !== 'string') throw new Error("Invalid lobby channelId");
        this.channelId = channelId;

        if (!Object.keys(stateTransitions).includes(state)) throw new Error("Invalid lobby state")
        this.state = state;

        // TODO Store players

        if (room) this.room = new Room(room);
    }

    emit(message) {
        console.log(`Lobby ${this.channelId}: ${message}`);
    }

    async stop() {
        channelLobbies.delete(this.channelId);
        this.emit("Destroyed")
    }

    /**
     * Transition to the new state.
     *
     * @param {string} targetState
     * @returns {Promise<void>}
     */
    async transition(targetState) {
        if (this.state === targetState) throw new Error(`Already in the ${targetState} state`);
        const transition = stateTransitions[targetState];
        if (!transition) throw new Error("Invalid lobby state");

        // TODO Get the channel, if not passed in.

        await transition(this);
        this.state = targetState;
    }
}


const stateTransitions = {
    intermission: async (lobby) => {
        lobby.emit('Transitioning to intermission');
    },

    working: async (lobby) => {
        lobby.emit('Transitioning to working');
    },

    meeting: async (lobby) => {
        lobby.emit('Transitioning to meeting');
    }
};

module.exports = Lobby;