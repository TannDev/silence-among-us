const { client } = require('../discord-bot/discord-bot');

const STATUS = {
    LIVING: 'Living',
    DYING: 'Dying',
    DEAD: 'Dead',
    WAITING: 'Waiting'
};

const REASON_PREFIX = 'Silence Among Us'

class Player {

    /**
     *
     * @param {Lobby} lobby - Lobby this player is for.
     * @param {Discord.GuildMember} [guildMember] - Guild member to attach.
     * @param {object} [document] - Existing settings, if loading from storage.
     */
    constructor(lobby, guildMember, { ...document } = {status: STATUS.WAITING} ) {
        this._document = document;

        // Attach the voice channel.
        this._voiceChannelId = lobby.voiceChannel.id;

        // Attach the guild member, if provided.
        if (guildMember) this.linkGuildMember(guildMember)
    }

    get status() {
        return this._document.status;
    }

    set status(status) {
        if (!Object.values(STATUS).includes(status)) throw new Error('Invalid player status.')
        this._document.status = status;
    }

    get guildMember() {
        return this._guildMember;
    }

    get discordId() {
        return this._document.discordId;
    }

    get discordName() {
        // This isn't preserved to the database, so it can always be loaded dynamically.
        return this._guildMember?.displayName;
    }
    get originalNickname() {
        return this._document.originalNickname;
    }

    get amongUsName() {
        return this._document.amongUsName;
    }

    get amongUsColor() {
        return this._document.amongUsColor;
    }

    set amongUsColor(color) {
        if (this.isSpectating) throw new Error("Can't set the color of a player that isn't playing.");
        if (!color) delete this._document.amongUsColor;
        else this._document.amongUsColor = color;
    }

    linkGuildMember(guildMember) {
        // Update the document.
        this._document.discordId = guildMember.id;

        // Attach the new guild member.
        this._guildMember = guildMember;

        // Update the original nickname, unless there's already one from a previous session.
        if (!this.originalNickname) this._document.originalNickname = guildMember.nickname;
    }

    matchesGuildMember(targetGuildMember) {
        if (!this._guildMember) return false;
        if (typeof targetGuildMember === 'string') return this._guildMember.id === targetGuildMember;
        return this._guildMember.id === targetGuildMember.id;
    }

    matchesAmongUsName(targetName) {
        if (!this.amongUsName || !targetName) return false;
        return this.amongUsName.replace(/\s/g, '').toLowerCase() === targetName.replace(/\s/g, '').toLowerCase();
    }

    kill() {
        if (this.status !== STATUS.DEAD) this.status = STATUS.DYING;
    }

    instantKill() {
        this.status = STATUS.DEAD;
    }

    revive() {
        this.status = STATUS.LIVING;
    }

    /**
     * Identifies whether this player is a "worker" (currently in the either the living or dying status).
     *
     * @return {boolean}
     */
    get isWorker() {
        return this.status === STATUS.LIVING || this.status === STATUS.DYING;
    }

    get isKnownDead() {
        return this.status === STATUS.DEAD;
    }

    get isDeadOrDying() {
        return this.status === STATUS.DEAD || this.status === STATUS.DYING;
    }

    get isWaiting() {
        return this.status === STATUS.WAITING;
    }

    /**
     * Identifies whether this player is spectating.
     * @returns {boolean}
     */
    get isSpectating() {
        return !this.amongUsName;
    }

    joinGame(amongUsName) {
        if (this.amongUsName) throw new Error("Player is already participating.");
        this.status = STATUS.WAITING;
        this._document.amongUsName = amongUsName;
    }

    async leaveGame() {
        delete this._document.amongUsName;
        delete this._document.amongUsColor;
        await this.editGuildMember(false, false, "Left Lobby");
    }

    async setForIntermission() {
        // Everyone is alive again at intermission.
        this.status = STATUS.LIVING;

        // Spectators aren't modified
        if (this.isSpectating) return;
        await this.editGuildMember(false, false, "Intermission");
    }

    async setForWorking() {
        // Spectators aren't modified.
        if (this.isSpectating) return;

        // Set audio permissions based on working status.
        this.isWorker
            ? await this.editGuildMember(true, true, "Working (Worker)")
            : await this.editGuildMember(false, false, "Working (Non-Worker)");
    }

    async setForMeeting() {
        // Spectators aren't modified
        if (this.isSpectating) return;

        // At the start of meetings, dying players become dead.
        if (this.status === STATUS.DYING) this.status = STATUS.DEAD;

        // Set audio permissions based living status
        this.status === STATUS.LIVING
            ? await this.editGuildMember(false, false, "Meeting (Living)")
            : await this.editGuildMember(true, false, "Meeting (Non-Living)");
    }

    /**
     * Sets the player's ability to speak and hear.
     *
     * The actual API call will be made after a short delay, and cancelled if another request is made within that
     * timeout. This prevents unnecessary API calls if the user is edited repeatedly in a short timeframe.
     *
     * @param {boolean} mute - Whether the player should be allowed to speak
     * @param {boolean} deaf - Whether the player should be allowed to hear
     * @param {string} [reason] - Reason for changing the settings.
     * @param {boolean} [anyChannel] - Update the voice state regardless of the channel the user is in.
     */
    async editGuildMember(mute, deaf, reason, anyChannel = false) {
        // If there's no connected guild member, ignore this.
        if (!this._guildMember) return;

        // Make sure we have the latest state.
        const member = await this._guildMember.fetch();
        const { voice } = member;

        // Don't adjust voice settings for other channels.
        const updateVoice = voice?.channelID && (anyChannel || voice.channelID === this._voiceChannelId);

        // Decide which nickname to use.
        const nick = this.isSpectating ? this.originalNickname : this.amongUsName;

        // Build the patch object.
        const patch = {};
        if (member.manageable && member.nickname !== nick) patch.nick = nick;
        if (updateVoice && voice.serverMute !== mute) patch.mute = mute;
        if (updateVoice && voice.serverDeaf !== deaf) patch.deaf = deaf;

        // Don't waste rate limits on duplicate requests.
        if (Object.keys(patch).length < 1) return;

        // Reset any existing timeout, to prevent spamming.
        if (this._nextGuildMemberEditTimeout) {
            clearTimeout(this._nextGuildMemberEditTimeout);
            delete this._nextGuildMemberEditTimeout;
        }

        // Create a new timeout, to post an update after a short delay.
        this._nextGuildMemberEditTimeout = setTimeout(async () => {
            delete this._nextGuildMemberEditTimeout;

            // Update the member.
            this.emit(`Set ${JSON.stringify(patch)}`);
            await member.edit(patch, `${REASON_PREFIX}${reason ? `: ${reason}` : ''}`);
        }, 500);
    }

    emit(message) {
        console.log(`Player ${this.discordName} (${this.discordId}): ${message}`);
    }

    toJSON() {
        const { ...document } = this._document;
        return document;
    }
}

module.exports = Player;
