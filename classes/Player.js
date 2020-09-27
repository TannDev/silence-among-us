const STATUS = {
    LIVING: 'living',
    DYING: 'dying',
    DEAD: 'dead',
    WAITING: 'waiting',
    SPECTATING: 'spectating'
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

    async setForIntermission() {
        // All non-spectators become living again at intermission.
        if (this.status !== STATUS.SPECTATING) this.status = STATUS.LIVING;
        return this.setMuteDeaf(false, false, "Intermission");
    }

    async setForWorking() {
        switch (this.status) {
            case STATUS.LIVING:
            case STATUS.DYING:
                return this.setMuteDeaf(true, true, "Working (Living)");
            case STATUS.DEAD:
            case STATUS.WAITING:
            case STATUS.SPECTATING:
                return this.setMuteDeaf(false, false, "Working (Non-Living)");
            default:
                throw new Error(`Unknown status: ${this.status}`);
        }
    }

    async setForMeeting() {
        // noinspection FallThroughInSwitchStatementJS
        switch (this.status) {
            case STATUS.LIVING:
                return this.setMuteDeaf(false, false, "Meeting (Living)");
            case STATUS.DYING:
                // Dying players become dead when meeting starts.
                this.status = STATUS.DEAD;
            case STATUS.DEAD:
            case STATUS.WAITING:
            case STATUS.SPECTATING:
                return this.setMuteDeaf(true, false, "Meeting (Non-Living)");
            default:
                throw new Error(`Unknown status: ${this.status}`);
        }
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
        const { voice } = await this._guildMember.fetch();
        if (!voice || voice.channelID !== this.voiceChannelId) return this;

        console.log(`Setting permissions for ${this.discordName}: ${mute ? 'mute' : 'unmute'} ${deaf ? 'deaf' : 'undeaf'}`);
        const finalReason = `Silence Among Us${reason ? `: ${reason}` : ''}`;
        await Promise.all([voice.setMute(mute, finalReason), voice.setDeaf(deaf, finalReason)]);
        return this;
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
