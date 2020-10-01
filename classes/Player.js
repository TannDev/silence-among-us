const STATUS = {
    LIVING: 'Living',
    DYING: 'Dying',
    DEAD: 'Dead',
    WAITING: 'Waiting',
    SPECTATING: 'Spectating'
};

const playersByDiscordId = new WeakMap()
const playersByAmongUsName = new WeakMap()

class Player {

    // TODO Refactor this class to be database-friendly.

    // TODO Two ways to create a player: Discord or Capture

    constructor(lobby, guildMember, amongUs ) {
        this.voiceChannelId = lobby.voiceChannel.id;
        if(guildMember) this.linkGuildMember(guildMember);
        if (amongUs) this.linkAmongUsPlayer(amongUs);
        this.status = amongUs ? STATUS.WAITING : STATUS.SPECTATING;
    }

    linkGuildMember(member) {
        if (this._guildMember) throw new Error("A Discord user is already linked with this player.");

        this._guildMember = member;
    }

    linkAmongUsPlayer(amongUs) {
        // TODO Check that the data is valid.
        this._amongUs = amongUs;
    }

    get member() {
        return this._guildMember;
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

    kill() {
        this.status = STATUS.DYING;
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

    async setForIntermission() {
        // All non-spectators become living again at intermission.
        if (this.status !== STATUS.SPECTATING) this.status = STATUS.LIVING;
        return this.setMuteDeaf(false, false, "Intermission");
    }

    async setForWorking() {
        // Spectators are muted during the game.
        if (this.status === STATUS.SPECTATING) return this.setMuteDeaf(true, false, "Spectator")

        // Set audio permissions based on working status.
        return this.isWorker
            ? this.setMuteDeaf(true, true, "Working (Worker)")
            : this.setMuteDeaf(false, false, "Working (Non-Worker)");
    }

    async setForMeeting() {
        // Spectators are muted during the game.
        if (this.status === STATUS.SPECTATING) return this.setMuteDeaf(true, false, "Spectator")

        // At the start of meetings, dying players become dead.
        if (this.status === STATUS.DYING) this.status = STATUS.DEAD;

        // Set audio permissions based living status
        return this.status === STATUS.LIVING
            ? this.setMuteDeaf(false, false, "Meeting (Living)")
            : this.setMuteDeaf(true, false, "Meeting (Non-Living)");
    }

    /**
     * Sets the player's ability to speak and hear
     * @param {boolean} mute - Whether the player should be allowed to speak
     * @param {boolean} deaf - Whether the player should be allowed to hear
     * @param {string} [reason] - Reason for changing the settings.
     * @returns {Promise<Player>}
     */
    async setMuteDeaf(mute, deaf, reason) {
        // If there's no connected member, ignore this.
        if (!this._guildMember) return this;

        // Make sure the user is still in the game channel.
        const member = await this._guildMember.fetch();
        const { voice } = member;
        if (!voice || voice.channelID !== this.voiceChannelId) return this;

        // Don't waste rate limits on duplicate requests.
        if (voice.serverMute === mute && voice.serverDeaf === deaf) return this;

        // Update the member.
        await member.edit({mute, deaf}, `Silence Among Us${reason ? `: ${reason}` : ''}`);

        this.emit(`Set ${mute ? 'mute' : 'unmute'} ${deaf ? 'deaf' : 'undeaf'}`);
        return this;
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
