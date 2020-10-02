const STATUS = {
    LIVING: 'Living',
    DYING: 'Dying',
    DEAD: 'Dead',
    WAITING: 'Waiting'
};

const REASON_PREFIX = 'Silence Among Us'

class Player {

    // TODO Refactor this class to be database-friendly.


    constructor(lobby, guildMember) {
        this.voiceChannelId = lobby.voiceChannel.id;
        if (guildMember) this.guildMember = guildMember;
    }

    get guildMember() {
        return this._guildMember;
    }

    set guildMember(guildMember) {
        this._guildMember = guildMember;
        this._originalNickname = guildMember.nickname;
    }

    get discordId() {
        return this._guildMember && this._guildMember.id;
    }

    get discordName() {
        return this._guildMember && this._guildMember.displayName;
    }

    get amongUsName() {
        return this._amongUs && this._amongUs.name;
    }

    get amongUsColor() {
        return this._amongUs && this._amongUs.color;
    }

    set amongUsColor(color) {
        if (!this._amongUs) throw new Error("Can't set the color of a player that isn't playing.");
        if (!color) delete this._amongUs.color;
        else this._amongUs.color = color;
    }

    matchesGuildMember(targetGuildMember) {
        if (!this.guildMember) return false;
        if (typeof targetGuildMember === 'string') return this.guildMember.id === targetGuildMember;
        return this.guildMember.id === targetGuildMember.id;
    }

    matchesAmongUsName(targetName) {
        const thisName = this.amongUsName;
        if (!thisName || !targetName) return false;
        return thisName.replace(/\s/g, '').toLowerCase() === targetName.replace(/\s/g, '').toLowerCase();
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
        return !this._amongUs;
    }

    joinGame(amongUsName) {
        if (this._amongUs) throw new Error("Player is already participating.");
        this.status = STATUS.WAITING;
        this._amongUs = {name: amongUsName};
    }


    async leaveGame() {
        delete this._amongUs;
        await this.editGuildMember(false, false, "Left Lobby");
    }

    async setForIntermission() {
        // Everyone is alive again at intermission.
        this.status = STATUS.LIVING;
        await this.editGuildMember(false, false, "Intermission");
    }

    async setForWorking() {
        // Spectators are muted during the game.
        if (this.isSpectating) return this.editGuildMember(true, false, "Spectator");

        // Set audio permissions based on working status.
        this.isWorker
            ? await this.editGuildMember(true, true, "Working (Worker)")
            : await this.editGuildMember(false, false, "Working (Non-Worker)");
    }

    async setForMeeting() {
        // Spectators are muted during the game.
        if (this.isSpectating) return this.editGuildMember(true, false, "Spectator");

        // At the start of meetings, dying players become dead.
        if (this.status === STATUS.DYING) this.status = STATUS.DEAD;

        // Set audio permissions based living status
        this.status === STATUS.LIVING
            ? await this.editGuildMember(false, false, "Meeting (Living)")
            : await this.editGuildMember(true, false, "Meeting (Non-Living)");
    }

    /**
     * Sets the player's ability to speak and hear
     * @param {boolean} mute - Whether the player should be allowed to speak
     * @param {boolean} deaf - Whether the player should be allowed to hear
     * @param {string} [reason] - Reason for changing the settings.
     */
    async editGuildMember(mute, deaf, reason) {
        // If there's no connected guild member, ignore this.
        if (!this._guildMember) return;

        // Make sure we have the latest state.
        const member = await this._guildMember.fetch();
        const { voice } = member;

        // Don't adjust voice settings for other channels.
        const updateVoice = voice && voice.channelID === this.voiceChannelId

        // Decide which nickname to use.
        const nick = this.isSpectating ? this._originalNickname : this.amongUsName;

        // Build the patch object.
        const patch = {};
        if (member.manageable && member.nickname !== nick) patch.nick = nick;
        if (updateVoice && voice.serverMute !== mute) patch.mute = mute;
        if (updateVoice && voice.serverDeaf !== deaf) patch.deaf = deaf;

        // Don't waste rate limits on duplicate requests.
        if (Object.keys(patch).length < 1) return;

        // Update the member.
        this.emit(`Set ${JSON.stringify(patch)}`);
        await member.edit(patch, `${REASON_PREFIX}${reason ? `: ${reason}` : ''}`);
    }

    emit(message) {
        console.log(`Player ${this.discordName} (${this.discordId}): ${message}`);
    }

    toJSON() {
        // TODO Find a better way to do this.
        return {
            discordName: this.discordName,
            discordId: this.discordId,
            amongUsName: this.amongUsName,
            status: this.status
        };
    }
}

module.exports = Player;
