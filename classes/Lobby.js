const chance = require('chance').Chance();
const { Permissions, MessageEmbed } = require('discord.js');
const discordClient = require('../discord-bot/discord-bot');
const Player = require('./Player');
const Room = require('./Room');

const requiredTextPermissionsFlags = [
    'VIEW_CHANNEL',
    'SEND_MESSAGES',
    'MANAGE_MESSAGES'
];
const requiredTextPermissions = new Permissions(requiredTextPermissionsFlags);
const requiredVoicePermissionsFlags = [
    // TODO Confirm that 'CONNECT' and 'SPEAK' aren't required.
    'VIEW_CHANNEL',
    'MUTE_MEMBERS',
    'DEAFEN_MEMBERS'
];
const requiredVoicePermissions = new Permissions(requiredVoicePermissionsFlags);

/**
 * The valid phases of a lobby.
 */
const PHASE = {
    INTERMISSION: 'Intermission',
    WORKING: 'Working',
    MEETING: 'Meeting'
};

const AUTOMATION = {
    WAITING: 'Waiting',
    CONNECTED: 'Connected',
    DISCONNECTED: 'Disconnected'
};

/**
 * Maps voice channel IDs to lobbies.
 * @type {Map<string, Lobby>}
 */
const lobbiesByVoiceChannel = new Map();

/**
 * Maps connect codes to lobbies.
 * @type {Map<string, Lobby>}
 */
const lobbiesByConnectCode = new Map();

// TODO Store lobbies somewhere outside of memory.

/**
 * @property {string} voiceChannelId - Id of the voice channel associated with the lobby.
 * @property {string} phase - Current phase of the lobby.
 * @property {Player[]} players - All the current (and past) players.
 * @property {Discord.VoiceChannel} _voiceChannel - The bound voice channel.
 * @property {Discord.TextChannel} _textChannel - The bound text channel.
 */
class Lobby {
    static get PHASE() { return PHASE; }

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
        if (await Lobby.findByVoiceChannel(voiceChannel)) throw new Error("There's already a lobby in that channel.");

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

        const lobby = new Lobby({ voiceChannelId, textChannelId, phase: PHASE.INTERMISSION, room });
        lobby._voiceChannel = voiceChannel;
        lobby._textChannel = textChannel;
        lobbiesByVoiceChannel.set(voiceChannelId, lobby);

        // Add players
        await Promise.all(voiceChannel.members.map(member => lobby.guildMemberConnected(member)));


        lobby.emit("Created");

        // TODO Save to database.

        // Post info.
        lobby.postLobbyInfo();
        return lobby;
    }

    /**
     * Find a lobby associated with a channel id.
     *
     * @param {string|Discord.VoiceChannel} voiceChannel - Voice channel, or channel ID.
     * @returns {Promise<Lobby>} - Lobby matching the channel, or null
     */
    static async findByVoiceChannel(voiceChannel) {
        if (typeof voiceChannel === 'string') voiceChannel = await discordClient.channels.fetch(voiceChannel);
        if (!voiceChannel) return null;

        // TODO Load from database.

        const lobby = lobbiesByVoiceChannel.get(voiceChannel.id);
        if (lobby) lobby._voiceChannel = voiceChannel;
        return lobby;
    }

    /**
     * Find a lobby associated with a connect code.
     *
     * @param connectCode
     * @returns {Promise<Lobby|null>}
     */
    static async findByConnectCode(connectCode) {
        if (!connectCode || typeof connectCode !== 'string') return null;
        return lobbiesByConnectCode.get(connectCode);
    }

    constructor({ voiceChannelId, textChannelId, phase, room }) {
        if (!voiceChannelId || typeof voiceChannelId !== 'string') throw new Error("Invalid voiceChannelId");
        this.voiceChannelId = voiceChannelId;
        this.textChannelId = textChannelId;

        if (!Object.values(PHASE).includes(phase)) throw new Error("Invalid lobby phase");
        this.phase = phase;

        // Create a map to hold the players.
        /**
         * Stores players by their Discord user id.
         * @type {Map<string, Player>}
         * @private
         */
        this._players = new Map();

        // TODO Handle the room properly
        if (room) this.room = room;

        // Create a connect code

        // Generate and link a new code.
        const connectCode = chance.string({ length: 6, casing: 'upper', alpha: true });
        lobbiesByConnectCode.set(connectCode, this);
        this._connectCode = connectCode;

        // Update the connection status
        this.automation = AUTOMATION.WAITING;

        return connectCode;
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

    /**
     * Return the players as an array.
     * @returns {Player[]}
     */
    get players() { return [...this._players.values()];}

    /**
     * @returns {boolean} - Whether or not the lobby is currently transitioning between phases.
     */
    get transitioning() {return Boolean(this._targetPhase);}

    get connectCode() {return this._connectCode;}

    emit(message) {
        console.log(`Lobby ${this.voiceChannelId}: ${message}`);
    }

    async updateAutomationConnection(connected) {
        this.automation = connected ? AUTOMATION.CONNECTED : AUTOMATION.DISCONNECTED;
        this.postLobbyInfo();
    }

    /**
     * Searches for players in the lobby.
     *
     * @param {Discord.GuildMember|string} member
     * @returns {Promise<Player>}
     */
    async getDiscordPlayer(member) {
        return this._players.get(member.id || member);
    }

    /**
     * Find a player with a matching in-game name.
     * @param {string} name - In-game name from Among Us.
     * @returns {Promise<Player>}
     */
    async getAmongUsPlayer(name) {
        // TODO Store a map of these, rather than a slow search.
        return this.players.find(player => player.matchesAmongUsName(name));
    }

    async amongUsJoin({ name, color, dead }) {
        let player = await this.getAmongUsPlayer(name);

        // If there's no player yet, add them.
        if (!player) {
            player = new Player(this, null, name);
            this._players.set(player.id, player);
            player.joinGame();
        }

        // Update their color.
        player.amongUsColor = color;

        // Start them in the appropriate status.
        dead ? player.kill() : player.revive();
        await this.setPlayerForCurrentPhase(player);

        // Post info.
        this.postLobbyInfo();
    }

    async amongUsLeave({ name }) {
        let player = await this.getAmongUsPlayer(name);
        if (!player) throw new Error(`AmongUs name "${name}" left, but isn't a player.`);

        // If the player is on Discord, mark them as as killed since they're out of the round.
        if (player.guildMember) {
            if (this.phase !== PHASE.INTERMISSION){
                player.instantKill();
                await this.setPlayerForCurrentPhase(player);
                // TODO Make them a spectator?
            }
        }

        // Otherwise, just remove them from the game entirely.
        else this._players.delete(player.id);
        // TODO Keep dead players around until the end of the match.

        // TODO Find a better way to identify disconnected players.

        // Post info.
        this.postLobbyInfo();
    }

    async amongUsKill({ name, dead }) {
        if (!dead) throw new Error(`amongUsKill for "${name}", but dead is falsy.`);

        let player = await this.getAmongUsPlayer(name);
        if (!player) throw new Error(`amongUsKill order for "${name}" but no such player.`);

        // Kill the player.
        player.kill();
        await this.setPlayerForCurrentPhase(player);

        // If a meeting is already underway, post updated lobby information.
        if (this.phase === PHASE.MEETING) this.postLobbyInfo();
    }

    async amongUsExile({ name, dead }) {
        if (!dead) throw new Error(`amongUsExile for "${name}", but dead is falsy.`);

        let player = await this.getAmongUsPlayer(name);
        if (!player) throw new Error(`amongUsKill order for "${name}" but no such player.`);

        // Kill the player.
        player.instantKill();
        await this.setPlayerForCurrentPhase(player);

        // Post info
        this.postLobbyInfo();
    }

    async amongUsForceUpdate({ name, color, dead, disconnected }) {
        if (disconnected) {
            // TODO Handle disconnected players.
            return;
        }

        // For everyone else, add/update them
        await this.amongUsJoin({ name, color, dead, disconnected });
    }

    async guildMemberJoin(guildMember, amongUsName) {
        // Ignore bots.
        if (guildMember.user.bot) return null;

        // Check if the player is already in this lobby.
        const playerId = guildMember.id;
        const player = this._players.get(playerId);

        if (!player) throw new Error(`Guild member (${guildMember.name} isn't in the lobby.`);

        // TODO Allow guild members to join without a name.
        // TODO Consider updating the user's nickname to match their game name.
        // TODO Allow guild members to change their name.

        // Check for an existing player with that name.
        const existingPlayer = this.players.find(player => player.matchesAmongUsName(amongUsName));
        if (existingPlayer) {
            // Don't allow duplicate names between guild members.
            if (existingPlayer.guildMember) throw new Error(`The name "${amongUsName}" is already taken.`);

            // Remove the player from the map.
            this._players.delete(existingPlayer.id);

            // Link the guild member.
            existingPlayer.guildMember = guildMember;

            // Add the player back into the map.
            this._players.set(existingPlayer.id, existingPlayer);
            this.emit(`Linked discord user ${existingPlayer.discordName} with name "${amongUsName}"`);
        }

        // Otherwise, set the player's name and add them to the game.
        else {
            player.amongUsName = amongUsName;
            player.joinGame();
        }


        await this.setPlayerForCurrentPhase(player);
        this.postLobbyInfo();
    }

    async guildMemberConnected(guildMember) {
        // Ignore bots.
        if (guildMember.user.bot) return null;

        // Fetch the existing player, or create a new spectator.
        let player = await this.getDiscordPlayer(guildMember);
        if (!player) {
            player = new Player(this, guildMember);
            this._players.set(player.id, player);
        }

        // Make sure their voice state matches the current game phase.
        await this.setPlayerForCurrentPhase(player);
        this.postLobbyInfo();
    }

    async guildMemberDisconnected(guildMember, skipUnmute) {
        // Ignore bots.
        if (guildMember.user.bot) return null;

        const player = await this.getDiscordPlayer(guildMember);
        if (!player) throw new Error("Guild member disconnected without ever having connected.");

        // If the player was spectating, remove them.
        if (player.isSpectating) this._players.delete(player.id);

        // Unless told otherwise, unmute the player.
        if (!skipUnmute) await player.editGuildMember(false, false, false, 'Left Lobby');
        this.postLobbyInfo();
    }


    /**
     * Kill the player(s) passed in.
     * Accepts arbitrarily many GuildMembers as arguments.
     *
     * @param {Discord.GuildMember} members
     * @returns {Promise<void>}
     */
    async guildMemberKill(...members) {
        if (this.phase === PHASE.INTERMISSION) throw new Error("You can't kill people during intermission.");

        // Generate kill orders for each member passed in.
        const killOrders = members.map(async member => {
            // If the member is a player is in this lobby, mark them as dying and update their state.
            const player = await this.getDiscordPlayer(member);
            if (player) {
                player.kill();
                await this.setPlayerForCurrentPhase(player);
            }
        });

        // Wait for all the kill orders to finish processing.
        await Promise.all(killOrders);

        // If a meeting is already underway, post updated lobby information.
        if (this.phase === PHASE.MEETING) this.postLobbyInfo();
    }

    /**
     * Revive the player(s) passed in.
     * Accepts arbitrarily many GuildMembers as arguments.
     *
     * @param {Discord.GuildMember} members
     * @returns {Promise<void>}
     */
    async guildMemberRevive(...members) {
        // Generate revival orders for each member passed in.
        const reviveOrders = members.map(async member => {
            // If the member is a player is in this lobby, mark them as living and update their state.
            const player = await this.getDiscordPlayer(member);
            if (player) {
                player.revive();
                await this.setPlayerForCurrentPhase(player);
            }
        });

        // Wait for all the revival orders to finish processing.
        await Promise.all(reviveOrders);

        // If a meeting is already underway, post updated lobby information.
        if (this.phase === PHASE.MEETING) this.postLobbyInfo();
    }

    /**
     * Updates the given player so they match the current phase.
     * @param {Player} player
     */
    async setPlayerForCurrentPhase(player) {
        switch (this.phase) {
            case PHASE.INTERMISSION:
                return player.setForIntermission();
            case PHASE.WORKING:
                return player.setForWorking();
            case PHASE.MEETING:
                return player.setForMeeting();
            default:
                throw new Error("Invalid target phase");
        }
    }

    /**
     * Post information about the lobby to the text channel.
     * @param {object} [options]
     * @param {boolean} [options.spoil] - Display Living and Dying players during the working phase.
     * @returns {module:"discord.js".MessageEmbed}
     */
    async postLobbyInfo(options = {}) {
        const roomInfo = this.room ? `*${this.room.code}* (${this.room.region})` : 'Not Listed';

        // Get and categorize players.
        const everyone = this.players; // TODO Put them in some sorted order.

        const players = everyone.filter(player => !player.isSpectating).map(player => {
            const showStatus = options.spoil || this.phase !== PHASE.WORKING || player.isKnownDead;
            const status = showStatus ? player.status : '_Working_';
            const name = player.discordId ? `<@${player.discordId}>` : player.amongUsName;
            const color = player.amongUsColor || 'Untracked';
            const emoji = player.isKnownDead ? ':skull:' : ':heartpulse:'

            return `${emoji} ${status}: ${name} (${color})`;
        }).join('\n')  || 'None';

        const spectators = everyone.filter(player => player.isSpectating)
            .map(player => `<@${player.discordId}>`).join('\n');

        const embed = new MessageEmbed()
            .setTitle(`Among Us - Playing in "${this.voiceChannel.name}"`)
            .addField('Game Phase', this.phase, true)
            .addField('Room Code', roomInfo, true)
            .addField('Players', players)
            .setFooter(`Capture Status: ${this.automation} (\`${this.connectCode}\`)`); // TODO Remove connect code.

        if (spectators) embed.addField('Spectators', spectators);

        // If there's a text channel bound, send the embed to it.
        if (this.textChannel) {
            // Reset any existing timeout, to prevent spamming.
            if (this._nextInfoPostTimeout) {
                clearTimeout(this._nextInfoPostTimeout);
                delete this._nextInfoPostTimeout;
            }
            // Create a new timeout, to post an update after a short delay.
            this._nextInfoPostTimeout = setTimeout(async () => {
                const messageSent = await this.textChannel.send(embed);
                await this.deleteLastLobbyInfo().catch(error => console.error(error));
                this._lastInfoPosted = messageSent;
            }, 500);
        }

        return embed;
    }

    async deleteLastLobbyInfo() {
        // If there was an old message, delete it.
        const messageToDelete = this._lastInfoPosted;
        delete this._lastInfoPosted;
        if (messageToDelete && messageToDelete.deletable) await messageToDelete.delete();
    }

    async stop() {
        // Unlink the from the "databases".
        lobbiesByVoiceChannel.delete(this.voiceChannelId);
        lobbiesByConnectCode.delete(this._connectCode);

        // Unmute all players.
        await Promise.all(this.players.map(player => player.editGuildMember(false, false, false, "Lobby Stopped")));

        // Delete the last lobby info.
        await this.deleteLastLobbyInfo();

        // Leave the voice channel
        this.voiceChannel.leave();

        this.emit("Destroyed");
    }

    /**
     * Transition to the new phase.
     *
     * @param {string} targetPhase
     * @returns {Promise<void>}
     */
    async transition(targetPhase) {
        // Prevent multiple or duplicate transitions.
        if (this.transitioning) throw new Error("The lobby is already transitioning between phases");
        if (this.phase === targetPhase) throw new Error(`The lobby is already in the ${targetPhase} phase`);
        this._targetPhase = targetPhase;

        // Sort players into batches, to avoid cross-talk.
        const everyone = this.players;
        const workers = everyone.filter(player => player.isWorker);
        const nonWorkers = everyone.filter(player => !player.isWorker);

        // Handle the transition.
        this.emit(`Transitioning to ${targetPhase}`);
        switch (targetPhase) {
            // And perform the same transition as intermission.
            case PHASE.INTERMISSION:
                await Promise.all(everyone.map(player => player.setForIntermission()));
                break;

            case PHASE.WORKING:
                // Update workers first, to avoid cross-talk, then everyone else.
                await Promise.all(workers.map(player => player.setForWorking()));
                await Promise.all(nonWorkers.map(player => player.setForWorking()));
                break;

            case PHASE.MEETING:
                // Update non-workers first, to avoid cross-talk, then everyone else.
                await Promise.all(nonWorkers.map(player => player.setForMeeting()));
                await Promise.all(workers.map(player => player.setForMeeting()));
                break;

            default:
                throw new Error("Invalid target phase");
        }

        this.phase = targetPhase;
        delete this._targetPhase;
        this.emit(`Entered ${targetPhase}`);

        // Send out an update.
        this.postLobbyInfo();
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