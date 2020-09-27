const { MessageEmbed } = require('discord.js');
const discord = require('../discord-bot/discord-bot');
const Player = require('./Player');
const Room = require('./Room');

/**
 * The valid states of a lobby.
 */
const STATE = {
    INTERMISSION: 'intermission',
    WORKING: 'working',
    MEETING: 'meeting'
};

/**
 * Maps voice channel IDs to lobbies.
 * @type {Map<string, Lobby>}
 */
const lobbies = new Map();

// TODO Store lobbies somewhere outside of memory.

/**
 * @property {string} voiceChannelId - Id of the voice channel associated with the lobby.
 * @property {string} state - Current state of the lobby.
 * @property {Player[]} players - All the current (and past) players.
 * @property {Discord.VoiceChannel} _voiceChannel - The bound voice channel.
 * @property {Discord.TextChannel} _textChannel - The bound text channel.
 */
class Lobby {
    static get STATE() {return STATE;}

    /**
     * Create a new lobby for a channel.
     *
     * @param {string|Discord.VoiceChannel} voiceChannel - Voice channel, or the id of one.
     * @param {string|Discord.TextChannel} [textChannel] - Guild text channel, or the id of one.
     * @param {Room} [room] - A room to start with.
     * @returns {Promise<Lobby>}
     */
    static async start(voiceChannel, textChannel, room) {
        if (typeof voiceChannel === 'string') {
            // TODO Get the voice channel associated with the ID.
            throw new Error("Starting a channel by ID isn't supported yet.");
        }
        if (typeof textChannel === 'string') {
            // TODO Get the voice channel associated with the ID.
            throw new Error("Starting a channel by ID isn't supported yet.");
        }

        const voiceChannelId = voiceChannel.id;
        const textChannelId = textChannel && textChannel.id;

        const lobby = new Lobby({ voiceChannelId, textChannelId, state: STATE.INTERMISSION, room});
        lobby._voiceChannel = voiceChannel;
        lobby._textChannel = textChannel;
        lobbies.set(voiceChannelId, lobby);

        // Add players
        // TODO Do this silently.
        await Promise.all(voiceChannel.members.map(member => lobby.connectPlayer(member)));


        lobby.emit("Created");

        // TODO Save to database.

        return lobby;
    }

    /**
     * Find a lobby associated with a channel id.
     *
     * @param {string|Discord.VoiceChannel} voiceChannel - Voice channel, or channel ID.
     * @returns {Promise<Lobby>} - Lobby matching the channel, or null
     */
    static async find(voiceChannel) {
        if (typeof voiceChannel === 'string') voiceChannel = await discord.channels.fetch(voiceChannel);
        if (!voiceChannel) return null;

        // TODO Load from database.

        const lobby = lobbies.get(voiceChannel.id);
        if (lobby) lobby._voiceChannel = voiceChannel;
        return lobby;
    }

    constructor({ voiceChannelId, textChannelId, state, players, room }) {
        if (!voiceChannelId || typeof voiceChannelId !== 'string') throw new Error("Invalid voiceChannelId");
        this.voiceChannelId = voiceChannelId;
        this.textChannelId = textChannelId;

        if (!Object.values(STATE).includes(state)) throw new Error("Invalid lobby state");
        this.state = state;

        // Create a map to hold the players.
        this._players = new Map();
        // TODO Add initial players from the constructor.

        // TODO Handle the room properly
        if (room) this.room = room;
    }

    /**
     * Get the underlying voice channel for the lobby.
     * @returns {Discord.VoiceChannel}
     */
    get voiceChannel() { return this._voiceChannel; }


    /**
     * Get the text channel used for the lobby.
     * @returns {Discord.TextChannel}
     */
    get textChannel() { return this._textChannel; }

    get players() { return [...this._players.values()];}

    /**
     * @returns {boolean} - Whether or not the lobby is currently transitioning between states.
     */
    get transitioning() {return Boolean(this._targetState);}

    emit(message) {
        console.log(`Lobby ${this.voiceChannelId}: ${message}`);
    }

    /**
     * Searches for players in the lobby.
     *
     * @param {Discord.GuildMember|string} member
     * @returns {Promise<Player>}
     */
    async getPlayer(member) {
        return this._players.get(member.id || member);
    }

    /**
     * Connects or reconnects a GuildMember as a player.
     * @param {Discord.GuildMember} member
     * @param {string} [status] - Status for the player to start with.
     * @returns {Promise<Player>} - The player added/updated.
     */
    async connectPlayer(member, status) {
        // Reject string-based connections.
        if (typeof member === 'string') throw new Error("Cannot connect new players via string ID");

        // Ignore bots.
        if (member.user.bot) return null;

        // Load or create a player.
        const playerId = member.id;
        const player = this._players.get(playerId) || new Player(this.voiceChannelId, member, status);
        this._players.set(playerId, player);

        // Update the player's state.
        await this.updatePlayerState(player);

        this.emit(`Connected player ${player.discordName} (${player.discordId})`);
        return player;
    }

    async killPlayer(member) {
        const player = await this.getPlayer(member);

        // If the player isn't already in the lobby, add them to it.
        if (!player) return this.connectPlayer(member, Player.STATUS.DYING);

        // Otherwise, mark them as dying and update their state.
        player.status = Player.STATUS.DYING;
        return this.updatePlayerState(player);
    }

    async revivePlayer(member) {
        const player = await this.getPlayer(member);

        // If the player isn't in the lobby, ignore the request.
        if (!player) return null;

        // Otherwise, mark them as living and update their state.
        player.status = Player.STATUS.LIVING;
        return this.updatePlayerState(player);
    }

    async updatePlayerState(player) {
        switch (this.state) {
            case STATE.INTERMISSION:
                return player.setForIntermission();
            case STATE.WORKING:
                return player.setForWorking();
            case STATE.MEETING:
                return player.setForMeeting();
            default:
                throw new Error("Invalid target state");
        }
    }

    /**
     * Post information about the lobby to the text channel.
     * @param {object} [options]
     * @param {boolean} [options.spoil] - Display Living and Dying players during the working state.
     * @returns {module:"discord.js".MessageEmbed}
     */
    async postLobbyInfo(options = {}) {
        const roomInfo = this.room ? `*${this.room.code}* (${this.room.region})` : 'Not Listed';

        const stateInfo = this.state[0].toUpperCase() + this.state.slice(1);


        const playerInfo = this.players
            .filter(player => player.status !== Player.STATUS.SPECTATING)
            .map(player => {
                const workingStates = [Player.STATUS.LIVING, Player.STATUS.DYING];
                const showStatus = options.spoil
                    || this.state !== STATE.WORKING
                    || !workingStates.includes(player.status);
                const status = showStatus ? player.status[0].toUpperCase() + player.status.slice(1) : '_Working_';

                // TODO Load URL from somewhere.
                // const showLink = this.state !== STATE.INTERMISSION && workingStates.includes(player.status);
                // const killUrl = `http://localhost:3000/api/lobby/${this.voiceChannelId}/${player.discordId}/kill`;
                // const killLink = showLink ? ` - [kill](${killUrl})` : '';

                return `<@${player.discordId}> - ${status}`;
            });

        const embed = new MessageEmbed()
            .setTitle(`Among Us - Playing in "${this.voiceChannel.name}"`)
            .addField('Game State', stateInfo, true)
            .addField('Room Code', roomInfo, true)
            .addField('Players', playerInfo)
            .setFooter(`Channel ID: ${this.voiceChannelId}`);

        // If there's a text channel bound, send the embed to it.
        if (this.textChannel) {
            await this.deleteLastLobbyInfo();
            this._lastInfoPosted = await this.textChannel.send(embed);
        }

        return embed;
    }

    async deleteLastLobbyInfo() {
        // If there was an old message, delete it.
        if (this._lastInfoPosted && this._lastInfoPosted.deletable) await this._lastInfoPosted.delete();
        delete this._lastInfoPosted;
    }

    async stop() {
        // Unlink the from the "database".
        lobbies.delete(this.voiceChannelId);

        // Unmute all players.
        await Promise.all(this.players.map(player => player.setMuteDeaf(false, false, "Lobby Stopped")));

        // Delete the last lobby info.
        await this.deleteLastLobbyInfo();

        this.emit("Destroyed");
    }

    /**
     * Transition to the new state.
     *
     * @param {string} targetState
     * @returns {Promise<void>}
     */
    async transition(targetState) {
        // Prevent multiple transitions.
        if (this.transitioning) throw new Error("Already transitioning between states")
        if (this.state === targetState) throw new Error(`Already in the ${targetState} state`);
        this._targetState = targetState;

        // Sort players into batches, to avoid cross-talk.
        const everyone = this.players;
        const workers = everyone.filter(player => player.isWorker);
        const nonWorkers = everyone.filter(player => !player.isWorker);

        // Handle the transition.
        this.emit(`Transitioning to ${targetState}`);
        switch (targetState) {
            case STATE.INTERMISSION:
                await Promise.all(everyone.map(player => player.setForIntermission()));
                break;

            case STATE.WORKING:
                // Update workers first, to avoid cross-talk, then everyone else.
                await Promise.all(workers.map(player => player.setForWorking()));
                await Promise.all(nonWorkers.map(player => player.setForWorking()));
                break;

            case STATE.MEETING:
                // Update non-workers first, to avoid cross-talk, then everyone else.
                await Promise.all(nonWorkers.map(player => player.setForMeeting()));
                await Promise.all(workers.map(player => player.setForMeeting()));
                break;

            default:
                throw new Error("Invalid target state");
        }

        this.state = targetState;
        delete this._targetState;
        this.emit(`Entered ${targetState}`);
    }

    toJSON() {
        const { players, room, ...document } = this;
        Object.keys(document)
            .filter(key => key.startsWith('_'))
            .forEach(key => delete document[key]);
        document.players = players.map(player => player.toJSON());
        document.room = room;
        return document;
    }
}

module.exports = Lobby;