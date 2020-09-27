const { Permissions, MessageEmbed } = require('discord.js');
const discordClient = require('../discord-bot/discord-bot');
const Player = require('./Player');
const Room = require('./Room');

const requiredTextPermissionsFlags = [
    'VIEW_CHANNEL',
    'SEND_MESSAGES',
    'MANAGE_MESSAGES'
]
const requiredTextPermissions = new Permissions((requiredTextPermissionsFlags));
const requiredVoicePermissionsFlags = [
    // TODO Confirm that 'CONNECT' and 'SPEAK' aren't required.
    'VIEW_CHANNEL',
    'MUTE_MEMBERS',
    'DEAFEN_MEMBERS'
]
const requiredVoicePermissions = new Permissions(requiredVoicePermissionsFlags)

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
     * @param {string|Discord.TextChannel} textChannel - Guild text channel, or the id of one.
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

        // Don't allow duplicate lobbies.
        if (await Lobby.find(voiceChannel)) throw new Error("There's already a lobby in that channel.");

        // Make sure the discord bot has sufficient permissions.
        if (!voiceChannel.permissionsFor(voiceChannel.guild.me).has(requiredVoicePermissions)) throw new Error([
            'Sorry, I don\'t have enough permissions in that voice channel.',
            `I need the following:\n\t- ${requiredVoicePermissionsFlags.join('\n\t- ')}`
        ].join('\n'));
        if (!textChannel.permissionsFor(textChannel.guild.me).has(requiredTextPermissions)) throw new Error([
            'Sorry, I don\'t have enough permissions in this text channel.',
            `I need the following:\n\t- ${requiredTextPermissionsFlags.join('\n\t- ')}`
        ].join('\n'));

        const voiceChannelId = voiceChannel.id;
        const textChannelId = textChannel.id;

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
        if (typeof voiceChannel === 'string') voiceChannel = await discordClient.channels.fetch(voiceChannel);
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

    /**
     * Kill the player(s) passed in.
     * Accepts arbitrarily many GuildMembers as arguments.
     *
     * @param {Discord.GuildMember} members
     * @returns {Promise<void>}
     */
    async killPlayer(...members) {
        if (this.state === STATE.INTERMISSION) throw new Error("You can't kill people during intermission.");

        // Generate kill orders for each member passed in.
        const killOrders = members.map(async member => {
            // If the member is a player is in this lobby, mark them as dying and update their state.
            const player = await this.getPlayer(member);
            if (player) {
                player.status = Player.STATUS.DYING;
                return this.updatePlayerState(player);
            }
        })

        // Wait for all the kill orders to finish processing.
        await Promise.all(killOrders);

        // If a meeting is already underway, post updated lobby information.
        if (this.state === STATE.MEETING) await this.postLobbyInfo()
    }

    /**
     * Revive the player(s) passed in.
     * Accepts arbitrarily many GuildMembers as arguments.
     *
     * @param {Discord.GuildMember} members
     * @returns {Promise<void>}
     */
    async revivePlayer(...members) {
        // Generate revival orders for each member passed in.
        const reviveOrders = members.map(async member => {
            // If the member is a player is in this lobby, mark them as living and update their state.
            const player = await this.getPlayer(member);
            if (player) {
                player.status = Player.STATUS.LIVING;
                return this.updatePlayerState(player);
            }
        })

        // Wait for all the revival orders to finish processing.
        await Promise.all(reviveOrders);

        // If a meeting is already underway, post updated lobby information.
        if (this.state === STATE.MEETING) await this.postLobbyInfo()
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

        // Leave the voice channel
        this.voiceChannel.leave();

        this.emit("Destroyed");
    }

    /**
     * Transition to the new state.
     *
     * @param {string} targetState
     * @returns {Promise<void>}
     */
    async transition(targetState) {
        // Prevent multiple or duplicate transitions.
        if (this.transitioning) throw new Error("The lobby is already transitioning between states")
        if (this.state === targetState) throw new Error(`The lobby is already in the ${targetState} state`);
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

        // Send out an update.
        await this.postLobbyInfo()
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