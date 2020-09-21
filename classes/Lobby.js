const { VoiceConnection } = require('discord.js');
const Room = require('./Room');

const schema = require('../lib/loadSchema')
const { components: { schemas: { Lobby: lobbySchema } } } = schema
const validate = require('../lib/getSchemaValidator')('Lobby', lobbySchema);

/**
 * Maps channel IDs to lobbies.
 * @type {Map<string, Lobby>}
 */
const channelLobbies = new Map();

/**
 * Stores connections for lobbies
 * @type {WeakMap<Lobby, Discord.VoiceConnection>}
 */
const voiceConnections = new WeakMap();

/**
 * Stores metadata about the lobbies.
 * @type {WeakMap<Lobby, object>}
 */
const metadata = new WeakMap()
// TODO Store lobbies somewhere outside of memory.

class Lobby {
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

    /**
     * Create a new lobby based on a voice connection.
     *
     * @param {Discord.VoiceConnection} voiceConnection
     */
    constructor(voiceConnection) {
        // Set the voice connection.
        voiceConnections.set(this, voiceConnection);

        metadata.set(this, {
            channelId: voiceConnection.channel.id,
            state: 'intermission',
            players: [],
            room: null
        })

        // Make sure the resulting data is valid.
        this.validate();

        // Register the lobby
        channelLobbies.set(this.channelId, this);

        // If the voice channel disconnects, deregister the lobby.
        voiceConnection.on('disconnect', () => channelLobbies.delete(this.channelId));
    }

    validate() {
        validate(metadata.get(this));
    }

    updateRoom(...params) {
        metadata.get(this).room = new Room(...params);
        this.validate();
    }

    get room() {
        metadata.get(this).room
    }

    /**
     * Get the voice connection for the channel.
     * @returns {Discord.VoiceConnection}
     */
    get voiceConnection(){
        return voiceConnections.get(this);
    }

    /**
     * Disconnect the voice connection, thus ending the lobby.
     *
     * @returns {Promise<void>}
     */
    async close () {
        await this.voiceConnection.disconnect();
    }

}

module.exports = Lobby;