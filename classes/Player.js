const STATUS = {
    LIVING: 'Living',
    DYING: 'Dying',
    DEAD: 'Dead',
    WAITING: 'Waiting',
    SPECTATING: 'Spectating'
};

class Player {
    static get STATUS() { return STATUS; };

    get STATUS() { return STATUS; };

    // TODO Refactor this class to be database-friendly.

    /**
     *
     * @param {string} voiceChannelId - ID of the channel the player is playing in.
     * @param {Discord.GuildMember} guildMember
     * @param {string} [status]
     */
    constructor(voiceChannelId, guildMember, status = STATUS.WAITING) {
        this.voiceChannelId = voiceChannelId;
        this._guildMember = guildMember;
        this.status = status;
    }

    get member() {
        return this._guildMember;
    }

    get discordId() {
        return this.member.id;
    }

    get discordName() {
        return this.member.displayName;
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

    async setForIntermission() {
        // All non-spectators become living again at intermission.
        if (this.status !== STATUS.SPECTATING) this.status = STATUS.LIVING;
        return this.setMuteDeaf(false, false, "Intermission");
    }

    async setForWorking() {
        // Set audio permissions based on working status.
        return this.isWorker
            ? this.setMuteDeaf(true, true, "Working (Worker)")
            : this.setMuteDeaf(false, false, "Working (Non-Worker)");
    }

    async setForMeeting() {
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
            status: this.status
        };
    }
}

module.exports = Player;
