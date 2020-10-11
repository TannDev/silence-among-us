const deepEquals = require('deep-equal');
const NodeCache = require('node-cache');
const Database = require('./Database');
const database = new Database('guilds');

/**
 * A local cache, to reduce database calls.
 * @type {NodeCache}
 */
const cache = new NodeCache({
    stdTTL: 600, // Cache guilds for 10-20 minutes, depending on the check period.
    useClones: false, // Store the original objects, for mutability.
})

class Guild {
    static async load(guildId) {
        // Check the cache first.
        const cachedGuild = await cache.get(guildId);
        if (cachedGuild) return cachedGuild;

        // Otherwise, create a new one.
        const document = await database.get(guildId).catch(error => console.error(error));
        return new Guild(document || { _id: guildId });
    }

    constructor(document) {
        // Store the document.
        this._document = document;

        // Ensure the ID is valid.
        if (!this.id || typeof this.id !== 'string') throw new Error('Guild.id must be a non-empty string.');

        // Add this to the cache.
        cache.set(this.id, this);
    }

    get id() { return this._document._id; }

    get commandPrefixes() {
        return this._document.commandPrefixes || ['!sau', '!s']
    }

    async updateCommandPrefixes(...params) {
        const prefixes = params.map(param => param.trim())

        // Skip the rest, if it's the same as what we already have.
        if (deepEquals(prefixes, this.commandPrefixes)) return;

        // Store the prefix and save.
        this._document.commandPrefixes = prefixes;
        await this.save();
    }

    async save() {
        const updates = await database.set(this._document).catch(error => console.error(error));
        if (updates) this._document._rev = updates.rev;
    }
}

module.exports = Guild;