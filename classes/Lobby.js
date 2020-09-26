const Room = require('./Room');

/**
 * Maps channel IDs to lobbies.
 * @type {Map<string, Lobby>}
 */
const channelLobbies = new Map();

// TODO Store lobbies somewhere outside of memory.

class Lobby {
    /**
     * Create a new lobby for a channel.
     *
     * @param {string} channelId - ID of the channel to be associated with the lobby.
     * @returns {Promise<Lobby>}
     */
    static async start(channelId) {
        // TODO Add starting players.
        const lobby = new Lobby({channelId, state: 'intermission'});
        channelLobbies.set(channelId, lobby);
        lobby.emit("Created")
        return lobby;
    }

    /**
     * Find a lobby associated with a channel id.
     *
     * @param {string} channelId - ID of the channel associated with the desired lobby.
     * @returns {Promise<Lobby>} - Lobby matching the channel, or null
     */
    static async find(channelId) {
        if (!channelId) return null;

        // TODO Load from a database and initialize.
        return channelLobbies.get(channelId);
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

    async transition(targetState) {
        if (this.state === targetState) throw new Error(`Already in the ${targetState} state`);
        const transition = stateTransitions[targetState];
        if (!transition) throw new Error("Invalid lobby state");
        await transition();
        this.state = targetState;
    }
}


const stateTransitions = {
    intermission: async () => {
        this.emit('Transitioning to intermission');
    },

    working: async () => {
        this.emit('Transitioning to working');
    },

    meeting: async () => {
        this.emit('Transitioning to meeting');
    }
};

module.exports = Lobby;