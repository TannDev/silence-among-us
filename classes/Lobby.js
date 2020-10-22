const chance = require('chance').Chance();
const deepEqual = require('deep-equal');
const { Permissions, MessageEmbed } = require('discord.js');
const { client, clientReady } = require('../discord-bot/discord-bot');
const Player = require('./Player');
const Room = require('./Room');
const Database = require('./Database');

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
    'DEAFEN_MEMBERS',
    'MANAGE_NICKNAMES'
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

// Connect to the database.
const database = new Database('lobbies');

// On startup, let the client and databases get ready. Then load all the stored lobbies.
console.log('Getting lobbies ready...');
const ready = clientReady
    .then(() => database.getAll())
    .then(async documents => {
        // Resume all loaded lobbies.
        await Promise.all(documents.map(async document => {
            try {
                const { voiceChannelId, textChannelId, players } = document;

                // Get the voice and text channels.
                const [voiceChannel, textChannel] = await Promise.all([
                    client.channels.fetch(voiceChannelId),
                    client.channels.fetch(textChannelId)
                ]);

                if (!textChannel) {
                    throw new Error(`Failed to find text channel ${textChannelId}. Cancelling lobby restoration.`);
                }

                // Alert users about the restart.
                textChannel.send("Uh oh! It looks like I may have restarted. Give me a few seconds to catch up.");

                if (!voiceChannel) {
                    textChannel.send("Oops! Now I can't find your voice channel. You'll need to start a new lobby.");
                    throw new Error(`Failed to find voice channel ${voiceChannelId}. Cancelling lobby restoration.`);
                }


                // Restore the lobby.
                const lobby = new Lobby(voiceChannel, textChannel, document);

                // Restore all the players.
                /** @type {Player[]} */
                const restoredPlayers = await Promise.all(players.map(async player => {
                    // Get the guild member, if there is one.
                    const guildMember = player.discordId && await lobby.guild.members.fetch(player.discordId);
                    return new Player(lobby, guildMember, player);
                }));

                // Add all the restored players to the lobby.
                restoredPlayers.forEach(player => lobby._players.add(player));

                // Handle everyone still in the channel.
                await Promise.all(voiceChannel.members.map(member => lobby.guildMemberConnected(member)));

                // Handle everyone who has left.
                await Promise.all(restoredPlayers
                    .filter(player => player.discordId && !voiceChannel.members.has(player.discordId))
                    .map(player => lobby.guildMemberDisconnected(player.guildMember)));

                // Post an update.
                lobby.scheduleInfoPost();
                lobby.scheduleSave();

            } catch (error) {
                console.error('Error resuming lobby:', error);
                await database.delete(document);
            }
        }));
    });

/**
 * @property {string} voiceChannelId - Id of the voice channel associated with the lobby.
 * @property {string} phase - Current phase of the lobby.
 * @property {Player[]} players - All the current (and past) players.
 * @property {Discord.VoiceChannel} _voiceChannel - The bound voice channel.
 * @property {Discord.TextChannel} _textChannel - The bound text channel.
 */
class Lobby {
    static get PHASE() { return PHASE; }

    static async getLobbyCount() {
        return lobbiesByVoiceChannel.size;
    }

    static async getLobbyList() {
        return [...lobbiesByVoiceChannel.values()]
            .map(lobby => `${lobby.voiceChannel.guild.name} - ${lobby.voiceChannel.name}`);
    }

    /**
     * Find a lobby associated with a channel id.
     *
     * @param {string|Discord.VoiceChannel} voiceChannel - Voice channel, or channel ID.
     * @returns {Promise<Lobby>} - Lobby matching the channel, or null
     */
    static async findByVoiceChannel(voiceChannel) {
        // Return immediately if no channel was provided.
        if (!voiceChannel) return null;

        // Wait for maps to populate, if near startup.
        await ready;

        // Get the voice channel id.
        const voiceChannelId = typeof voiceChannel === 'string' ? voiceChannel : voiceChannel.id;
        if (!voiceChannelId) throw new Error("Invalid voice channel.");

        // Get the lobby from the map.
        const lobby = voiceChannel && lobbiesByVoiceChannel.get(voiceChannelId);

        // If there's a lobby, reset the timer to destroy it.
        if (lobby) lobby.resetInactivityTimeout();

        // Return the lobby.
        return lobby;
    }

    /**
     * Find a lobby associated with a connect code.
     *
     * @param connectCode
     * @returns {Promise<Lobby>}
     */
    static async findByConnectCode(connectCode) {
        // Wait for maps to populate, if near startup.
        await ready;

        // Fetch the lobby by connect code.
        const lobby = connectCode && lobbiesByConnectCode.get(connectCode);

        // If there's a lobby, reset the timer to destroy it.
        if (lobby) lobby.resetInactivityTimeout();

        // Return the lobby.
        return lobby;
    }

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

        // Build a new base document.
        const document = {
            _id: voiceChannel.id,
            voiceChannelId: voiceChannel.id,
            textChannelId: textChannel.id,
            phase: PHASE.INTERMISSION,
            room
        };

        const lobby = new Lobby(voiceChannel, textChannel, document);

        // Add players
        await Promise.all(voiceChannel.members.map(member => lobby.guildMemberConnected(member)));


        // Post info.
        lobby.emit("Created");
        lobby.scheduleInfoPost();

        // Immediately save to the database.
        await lobby.save();

        // Return the new lobby.
        return lobby;
    }

    constructor(voiceChannel, textChannel, { room, ...document }) {
        if (!voiceChannel) throw new Error('A voice channel is required for a lobby.');
        if (!voiceChannel) throw new Error('A text channel is required for a lobby.');
        this._voiceChannel = voiceChannel;
        this._textChannel = textChannel;
        this._document = document;

        // Don't allow duplicate lobbies.
        if (lobbiesByVoiceChannel.has(voiceChannel.id)) throw new Error("There's already a lobby in that channel.");

        // Make sure the discord bot has sufficient permissions.
        if (!voiceChannel.permissionsFor(voiceChannel.guild.me).has(requiredVoicePermissions)) throw new Error([
            'Sorry, I don\'t have enough permissions in that voice channel.',
            `I need the following:\n\t- ${requiredVoicePermissionsFlags.join('\n\t- ')}`
        ].join('\n'));
        if (!textChannel.permissionsFor(textChannel.guild.me).has(requiredTextPermissions)) throw new Error([
            'Sorry, I don\'t have enough permissions in this text channel.',
            `I need the following:\n\t- ${requiredTextPermissionsFlags.join('\n\t- ')}`
        ].join('\n'));

        // Verify the phase.
        if (!document.phase) document.phase = PHASE.INTERMISSION;
        if (!Object.values(PHASE).includes(document.phase)) throw new Error("Invalid lobby phase");

        // If there's no connect code in the document, create one.
        if (!this.connectCode) document.connectCode = chance.string({ length: 8, casing: 'upper', alpha: true });

        // Create a map to hold the players.
        /**
         * Stores players by their Discord user id.
         * @type {Set<Player>}
         * @private
         */
        this._players = new Set();
        // TODO Make players properly serializable.

        // Store the room.
        if (room) this.room = room;


        // Update the connection status
        // TODO Verify that this doesn't need to be serialized.
        this.automation = AUTOMATION.WAITING;

        // Store this in the maps.
        lobbiesByVoiceChannel.set(voiceChannel.id, this);
        lobbiesByConnectCode.set(this.connectCode, this);

        // Start the inactivity timeout.
        this.resetInactivityTimeout();
    }

    /**
     * Get the guild for the lobby.
     * @returns {Discord.Guild}
     */
    get guild() { return this._voiceChannel.guild; }

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
    get players() { return [...this._players];}

    get phase() { return this._document.phase; }

    /**
     * @returns {boolean} - Whether or not the lobby is currently transitioning between phases.
     */
    get transitioning() {return Boolean(this._transitioning);}

    get connectCode() {return this._document.connectCode;}

    get room() {return this._document.room;};

    set room(room) {
        if (!room) delete this._document.room;
        else this._document.room = new Room(room);
        this.scheduleInfoPost();
        this.scheduleSave();
    }

    emit(message) {
        console.log(`Lobby ${this.voiceChannel.id}: ${message}`);
    }

    async updateAutomationConnection(connected) {
        this.automation = connected ? AUTOMATION.CONNECTED : AUTOMATION.DISCONNECTED;
        this.scheduleInfoPost();
    }

    /**
     * Searches for players in the lobby.
     *
     * @param {Discord.GuildMember|string} guildMember
     * @returns {Player}
     */
    getGuildMemberPlayer(guildMember) {
        // TODO Store a map of these, rather than a slow search.
        return this.players.find(player => player.matchesGuildMember(guildMember));
    }

    /**
     * Find a player with a matching in-game name.
     * @param {string} name - In-game name from Among Us.
     * @returns {Player}
     */
    getAmongUsPlayer(name) {
        // TODO Store a map of these, rather than a slow search.
        return this.players.find(player => player.matchesAmongUsName(name));
    }

    async amongUsJoin({ name, color, dead }) {
        let player = this.getAmongUsPlayer(name);

        // If there's no player yet, add them.
        if (!player) {
            player = new Player(this);
            this._players.add(player);
            player.joinGame(name);
        }

        // Update their color.
        player.amongUsColor = color;

        // Start them in the appropriate status.
        dead ? player.kill() : player.revive();
        await this.setPlayerForCurrentPhase(player);

        // Schedule updates.
        this.scheduleInfoPost();
        this.scheduleSave();
    }

    async amongUsLeave({ name }) {
        let player = this.getAmongUsPlayer(name);
        if (!player) throw new Error(`AmongUs name "${name}" left, but isn't a player.`);

        // If the player is on Discord, mark them as as killed since they're out of the round.
        if (player.guildMember) {
            // Remove the color.
            player.amongUsColor = null;
            // TODO Find a better way to track if the player is auto-tracked.

            // Outside of intermission, kill them.
            if (this.phase !== PHASE.INTERMISSION) {
                player.instantKill();
                await this.setPlayerForCurrentPhase(player);
                // TODO Make them a spectator?
            }
        }

        // Otherwise, just remove them from the game entirely.
        else this._players.delete(player);
        // TODO Keep dead players around until the end of the match.

        // TODO Find a better way to identify disconnected players.

        // Schedule updates.
        this.scheduleInfoPost();
        this.scheduleSave();
    }

    async amongUsKill({ name, dead }) {
        if (!dead) throw new Error(`amongUsKill for "${name}", but dead is falsy.`);

        let player = this.getAmongUsPlayer(name);
        if (!player) throw new Error(`amongUsKill order for "${name}" but no such player.`);

        // Kill the player.
        player.kill();
        await this.setPlayerForCurrentPhase(player);

        // Schedule updates.
        this.scheduleInfoPost();
        this.scheduleSave();
    }

    async amongUsExile({ name, dead }) {
        if (!dead) throw new Error(`amongUsExile for "${name}", but dead is falsy.`);

        let player = this.getAmongUsPlayer(name);
        if (!player) throw new Error(`amongUsKill order for "${name}" but no such player.`);

        // Kill the player.
        player.instantKill();
        await this.setPlayerForCurrentPhase(player);

        // Schedule updates.
        this.scheduleInfoPost();
        this.scheduleSave();
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
        const player = this.getGuildMemberPlayer(guildMember);
        if (!player) throw new Error(`Guild member (${guildMember.name} isn't in the lobby.`);

        // Check for an existing player with that name.
        const existingPlayer = this.players.find(player => player.matchesAmongUsName(amongUsName));
        if (existingPlayer) {
            // Don't allow duplicate names between guild members.
            if (existingPlayer.discordId) throw new Error(`The name "${amongUsName}" is already taken.`);

            // Link the guild member to the existing player.
            existingPlayer.linkGuildMember(guildMember);
            await this.setPlayerForCurrentPhase(existingPlayer);

            // Remove the spectating guild member.
            this._players.delete(player);

            this.emit(`Linked discord user ${existingPlayer.discordName} with name "${amongUsName}"`);
        }

        // Otherwise, set the player's name and add them to the game.
        else {
            player.joinGame(amongUsName);
            await this.setPlayerForCurrentPhase(player);
        }

        // Schedule updates.
        this.scheduleInfoPost();
        this.scheduleSave();
    }

    async guildMemberQuit(guildMember) {
        // Ignore bots.
        if (guildMember.user.bot) return null;

        // Check if the player is already in this lobby.
        const player = this.getGuildMemberPlayer(guildMember);
        if (!player) throw new Error(`Guild member (${guildMember.name} isn't in the lobby.`);
        if (player.isSpectating) throw new Error("You're already a spectator.");

        // Gather player information, if we need to create a new one.
        const color = player.amongUsColor;
        const name = player.amongUsName;
        const dead = player.isDeadOrDying;

        // Mark the player as having left.
        await player.leaveGame();
        await this.setPlayerForCurrentPhase(player);

        // If the player was being tracked by automation, create a new one.
        if (color) await this.amongUsJoin({ name, color, dead });

        // Schedule updates.
        this.scheduleInfoPost();
        this.scheduleSave();
    }


    async guildMemberEject(...members) {
        // Process all submitted members.
        await Promise.all(members
            .filter(member => !member.user.bot)
            .map(async member => {
                // Get the player.
                const player = this.getGuildMemberPlayer(member);

                // Ignore spectators.
                if (player.isSpectating) return;

                // Update the player as though they quit.
                await this.guildMemberQuit(member);

                // Remove the player if they've already left the channel.
                if (!this.voiceChannel.members.has(member.id)) this._players.delete(player);
            }));

        // Schedule updates.
        this.scheduleInfoPost();
        this.scheduleSave();
    }

    async guildMemberConnected(guildMember) {
        // Ignore bots.
        if (guildMember.user.bot) return null;

        // Fetch the existing player, or create a new spectator.
        let player = this.getGuildMemberPlayer(guildMember);
        if (!player) {
            player = new Player(this, guildMember);
            this._players.add(player);
        }

        // Make sure their voice state matches the current game phase.
        await this.setPlayerForCurrentPhase(player);

        // Schedule updates.
        this.scheduleInfoPost();
        this.scheduleSave();
    }

    async guildMemberDisconnected(guildMember) {
        // Ignore bots.
        if (guildMember.user.bot) return null;

        const player = this.getGuildMemberPlayer(guildMember);
        if (!player) throw new Error("Guild member disconnected without ever having connected.");

        // If the player was spectating, remove them.
        if (player.isSpectating) this._players.delete(player);

        // Unmute the player, for having left the channel.
        await player.editGuildMember(false, false, "Left Voice Channel", true);

        // End the lobby if there are no more connected players.
        if (this.players.every(player => !player.guildMember)) {
            await this.stop();
            this.textChannel.send("Everyone in Discord left, so I ended the lobby.");
        }
        else {
            // Schedule updates.
            this.scheduleInfoPost();
            this.scheduleSave();
        }
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
            const player = this.getGuildMemberPlayer(member);
            if (player) {
                player.kill();
                await this.setPlayerForCurrentPhase(player);
            }
        });

        // Wait for all the kill orders to finish processing.
        await Promise.all(killOrders);

        // Schedule updates.
        this.scheduleInfoPost();
        this.scheduleSave();
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
            const player = this.getGuildMemberPlayer(member);
            if (player) {
                player.revive();
                await this.setPlayerForCurrentPhase(player);
            }
        });

        // Wait for all the revival orders to finish processing.
        await Promise.all(reviveOrders);

        // Schedule updates.
        this.scheduleInfoPost();
        this.scheduleSave();
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

        // Mark the transition and switch to the new phase.
        this._transitioning = true;
        this._document.phase = targetPhase;

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

        delete this._transitioning;
        this.emit(`Entered ${targetPhase}`);

        // Schedule updates.
        this.scheduleInfoPost();
        this.scheduleSave();
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
     * @param {boolean} [options.force] - Post a new update, even if it's identical to the last one.
     * @returns {module:"discord.js".MessageEmbed}
     */
    async scheduleInfoPost(options = {}) {
        const roomInfo = this.room ? `**${this.room.code}** (${this.room.region})` : 'Not Listed';

        // Get and categorize players.
        const everyone = this.players; // TODO Put them in some sorted order.

        const players = everyone.filter(player => !player.isSpectating).map(player => {
            const showStatus = options.spoil || this.phase !== PHASE.WORKING || player.isWaiting || player.isKnownDead;
            const status = showStatus ? player.status : '_Working_';
            const name = player.discordId ? `<@${player.discordId}>` : player.amongUsName;

            const hasNameMismatch = player.discordName && player.discordName !== player.amongUsName;
            const mismatchDisplay = hasNameMismatch ? ` (${player.amongUsName})` : '';
            const color = player.amongUsColor || 'Untracked';

            const emoji = player.isWaiting ? ':stopwatch:' : (player.isKnownDead ? ':skull:' : ':heartpulse:');

            return `${emoji} ${status}: ${name}${mismatchDisplay} (${color})`;
        }).join('\n') || 'None';

        const spectators = everyone.filter(player => player.isSpectating)
            .map(player => `<@${player.discordId}>`).join('\n');

        const embed = new MessageEmbed()
            .setTitle(`Among Us - Playing in "${this.voiceChannel.name}"`)
            .addField('Game Phase', this.phase, true)
            .addField('Room Code', roomInfo, true)
            .addField('Players', players)
            .setFooter(`Capture Status: ${this.automation}`);

        if (spectators) {
            embed.addField('Spectators', spectators);
            embed.addField('Join the Game!', 'Use `!sau join <In-Game Name>` to join!');
        }

        // If there's a text channel bound, send the embed to it.
        if (this.textChannel) {
            // Reset any existing timeout, to prevent spamming.
            if (this._nextInfoPostTimeout) {
                clearTimeout(this._nextInfoPostTimeout);
                delete this._nextInfoPostTimeout;
            }
            // Create a new timeout, to post an update after a short delay.
            this._nextInfoPostTimeout = setTimeout(async () => {
                delete this._nextInfoPostTimeout;
                // Skip the post if it's the same as the last one.
                if (this._lastInfoPosted && !options.force) {
                    const [lastEmbed] = this._lastInfoPosted.embeds;
                    if (deepEqual(lastEmbed.toJSON(), embed.toJSON())) return;
                }
                // Post a new message.
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
        // Unlink the maps.
        lobbiesByVoiceChannel.delete(this.voiceChannel.id);
        lobbiesByConnectCode.delete(this._connectCode);

        // Reset all players.
        await Promise.all(this.players.map(player => player.leaveGame()));

        // Delete the last lobby info.
        await this.deleteLastLobbyInfo();

        // Leave the voice channel
        this.voiceChannel.leave();

        // Delete the lobby from the database.
        this.cancelScheduledSave();
        await database.delete(this._document);

        this.emit("Destroyed");
    }

    async resetToMenu() {
        // Delete the room code.
        this.room = null;

        // Disconnect automation players.
        this.players.forEach(player => {
            // If there's no associated guild member, just remove the player.
            if (!player.guildMember) return this._players.delete(player);

            // Otherwise, unset the color.
            if (player.amongUsColor) player.amongUsColor = null;
        });

        // Return to intermission, unless already there.
        if (this.phase !== PHASE.INTERMISSION) await this.transition(PHASE.INTERMISSION);
    }

    resetInactivityTimeout() {
        if (this._inactivityTimeout) clearTimeout(this._inactivityTimeout);
        this._inactivityTimeout = setTimeout(() => {
            this.emit('Terminating due to inactivity.');
            this.stop().catch(error => console.error(error));
            // TODO Use an embed for this. (Ideally inside stop.)
            this.textChannel.send("Nothing has happened in an hour, so I ended the lobby.");
        }, 1000 * 60 * 60)
    }

    cancelScheduledSave() {
        if (this._nextSaveTimeout) {
            clearTimeout(this._nextSaveTimeout);
            delete this._nextSaveTimeout;
        }
    }

    scheduleSave() {
        // Reset any existing timeout, to reduce database load.
        this.cancelScheduledSave();

        // Create a new timeout, to save after a short delay.
        this._nextSaveTimeout = setTimeout(() => {
            delete this._nextSaveTimeout;
            this.save();
        }, 1500);
    }

    save() {
        database.set(this.toJSON())
            .then(({ id, rev }) => {
                this._document._id = id;
                this._document._rev = rev;
            })
            .catch(error => console.error(error));

    }

    toJSON() {
        const { players } = this;
        const { ...document } = this._document;
        document.players = players.map(player => player.toJSON());
        return document;
    }
}

module.exports = Lobby;