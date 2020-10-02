const STATUS = {
    LIVING: 'Living',
    DYING: 'Dying',
    DEAD: 'Dead',
    WAITING: 'Waiting',
    SPECTATING: 'Spectating'
};

class Player {

    // TODO Refactor this class to be database-friendly.


    constructor(lobby, guildMember, amongUsName) {
        this.voiceChannelId = lobby.voiceChannel.id;
        if (guildMember) this.guildMember = guildMember;
        if (amongUsName) this.amongUsName = amongUsName;
        this.status = STATUS.SPECTATING;
    }

    /**
     * Gets a unique ID for the player.
     * If the player is linked to a guild member, the ID is the member's ID.
     * Otherwise, it's based on the amongUsName.
     * @returns {string}
     */
    get id() {
        return this._guildMember ? this.discordId : `unlinked-${this.amongUsName}`;
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

    set amongUsName(name) {
        if (!this._amongUs) this._amongUs = {};
        this._amongUs.name = name;
    }

    get amongUsColor() {
        return this._amongUs && this._amongUs.color;
    }

    set amongUsColor(color) {
        if (!this._amongUs) this._amongUs = {};
        if (!color) delete this._amongUs.color;
        else this._amongUs.color = color;
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
        return this.status === STATUS.SPECTATING;
    }

    joinGame() {
        if (this.status !== STATUS.SPECTATING) throw new Error("Player is already participating.");
        this.status = STATUS.WAITING;
    }

    async setForIntermission() {
        // All non-spectators become living again at intermission.
        if (this.status !== STATUS.SPECTATING) this.status = STATUS.LIVING;
        await this.editGuildMember(false, false, false, "Intermission");
    }

    async setForWorking() {
        // Spectators are muted during the game.
        if (this.status === STATUS.SPECTATING) return this.editGuildMember(false, true, false, "Spectator");

        // Set audio permissions based on working status.
        this.isWorker
            ? await this.editGuildMember(true, true, true, "Working (Worker)")
            : await this.editGuildMember(true, false, false, "Working (Non-Worker)");
    }

    async setForMeeting() {
        // Spectators are muted during the game.
        if (this.status === STATUS.SPECTATING) return this.editGuildMember(false, true, false, "Spectator");

        // At the start of meetings, dying players become dead.
        if (this.status === STATUS.DYING) this.status = STATUS.DEAD;

        // Set audio permissions based living status
        this.status === STATUS.LIVING
            ? await this.editGuildMember(true, false, false, "Meeting (Living)")
            : await this.editGuildMember(true, true, false, "Meeting (Non-Living)");
    }

    /**
     * Sets the player's ability to speak and hear
     * @param {boolean} mute - Whether the player should be allowed to speak
     * @param {boolean} deaf - Whether the player should be allowed to hear
     * @param {string} [reason] - Reason for changing the settings.
     * @returns {Promise<Player>}
     */
    async editGuildMember(syncName, mute, deaf, reason) {
        // If there's no connected member, ignore this.
        if (!this._guildMember) return this;

        // Make sure the user is still in the game channel.
        const member = await this._guildMember.fetch();
        const { voice } = member;
        if (!voice || voice.channelID !== this.voiceChannelId) return this;

        // Don't waste rate limits on duplicate requests.
        if (voice.serverMute === mute && voice.serverDeaf === deaf) return this;

        // TODO Check permissions to set a nickname.
        // Set a nickname
        // const nick = (syncName && this.amongUsName) ? this.amongUsName : this._originalNickname;

        // Update the member.
        await member.edit({ mute, deaf }, `Silence Among Us${reason ? `: ${reason}` : ''}`);

        this.emit(`Set ${mute ? 'mute' : 'unmute'} ${deaf ? 'deaf' : 'undeaf'}`);
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
