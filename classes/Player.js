const STATUS = {
    LIVING: 'living',
    DEAD: 'dead',
    WAITING: 'waiting',
    SPECTATING: 'spectating'
};

class Player {
    static get STATUS() { return STATUS; };

    // TODO Refactor this class to be database-friendly.

    /**
     *
     * @param {string} channelId - ID of the channel the player is playing in.
     * @param {Discord.GuildMember} guildMember
     * @param {string} [status]
     */
    constructor(channelId, guildMember, status = STATUS.LIVING) {
        this.channelId = channelId;
        this._guildMember = guildMember;
        this.status = status;
    }

    get id() {
        return this._guildMember.id;
    }

    get name() {
        return this._guildMember.displayName;
    }

    async setForIntermission() {
        if (this.status !== STATUS.SPECTATING) this.status = STATUS.LIVING;
        return this.setMuteDeaf(false, false, "Intermission");
    }

    async setForWorking() {
        switch (this.status) {
            case STATUS.LIVING:
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
        switch (this.status) {
            case STATUS.LIVING:
                return this.setMuteDeaf(false, false, "Meeting (Living)");
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
     * @returns {Promise<void>}
     */
    async setMuteDeaf(mute, deaf, reason){
        // Make sure the user is still in the game channel.
        const {voice} = await this._guildMember.fetch();
        if (!voice || voice.channelID !== this.channelId) return;

        console.log(`Setting permissions for ${this.name}: ${mute ? 'mute' : 'unmute'} ${deaf ? 'deaf' : 'undeaf'}`)
        const finalReason = `Silence Among Us${reason ? `: ${reason}` : ''}`
        await Promise.all([voice.setMute(mute, finalReason), voice.setDeaf(deaf, finalReason)]);
    }
}

module.exports = Player;