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
    useClones: false // Store the original objects, for mutability.
});

const BOOLEAN_OPTIONS = ['on', 'off', 'true', 'false'];
const BOOLEAN_TRUE_PATTERN = /^(:?1|t(?:rue)?|y(?:es)?|on)$/i;
const BOOLEAN_FALSE_PATTERN = /^(:?0|f(?:alse)?|n(?:O)?|off)$/i;

// TODO Convert this to a map of class instances.
const SETTINGS = {
    prefix: {
        defaultValue: '!sau|!s',
        description: [
            'The command prefix that the bot will respond to.',
            'To set multiple options, separate prefixes with spaces or `|`.'
        ].join(' '),
        setter: (value) => {
            const stripped = value.toLowerCase().trim().split(/[\s|]+/g).join('|');
            if (!stripped) throw new Error("Can't set an empty command prefix.");
            return stripped;
        }
    },
    autojoin: {
        defaultValue: true,
        description: [
            "When enabled, spectators will automatically join an automated lobby",
            "if their saved in-game name matches an unlinked player from the capture."
        ].join(' '),
        options: BOOLEAN_OPTIONS,
        setter: (value) => {
            if (value.match(BOOLEAN_TRUE_PATTERN)) return true;
            if (value.match(BOOLEAN_FALSE_PATTERN)) return false;
            throw new Error("Autojoin must be either `on` or `off`");
        }
    },
    spectators: {
        defaultValue: 'mute',
        description: [
            'Controls how spectators are handled during the game:',
            '- `mute`: Mute spectators during the working and meeting phases.',
            '- `ignore`: Ignore spectators entirely, never muting/unmuting them.',
            '- `dynamic`: Treat spectators like dead players. (**Will** cause severe lag with 10+ users.)'
        ].join('\n'),
        options: ['mute', 'ignore', 'dynamic'],
        setter: (value) => {
            const parsed = value?.toLowerCase().trim();
            if (!SETTINGS.spectators.options.includes(parsed)) throw new Error("That's not a valid option.");
            return parsed;
        }
    },
    speech: {
        defaultValue: true,
        description: "When enabled, the bot will play spoken announcements into the voice channel.",
        options: BOOLEAN_OPTIONS,
        setter: (value) => {
            if (value.match(BOOLEAN_TRUE_PATTERN)) return true;
            if (value.match(BOOLEAN_FALSE_PATTERN)) return false;
            throw new Error("Speech must be either `on` or `off`");
        }
    }
};

function getSetting(key) {
    const setting = SETTINGS[key?.toLowerCase()];
    if (!setting) throw new Error("There's no such setting.");
    return setting;
}

class GuildConfig {
    static get SETTINGS() {
        return SETTINGS;
    }

    static async load(guildId) {
        // Check the cache first.
        const cachedGuild = await cache.get(guildId);
        if (cachedGuild) return cachedGuild;

        // Otherwise, create a new one.
        const document = await database.get(guildId).catch(error => console.error(error));
        return new GuildConfig(document ?? { _id: guildId });
    }

    constructor({ ...document }) {
        // Store the document.
        this._document = document;

        // Ensure the ID is valid.
        if (!this.id || typeof this.id !== 'string') throw new Error('Guild.id must be a non-empty string.');

        // Make sure there's a config property.
        if (!document.config) document.config = {};

        // Add this to the cache.
        cache.set(this.id, this);
    }

    get id() { return this._document._id; }

    usesDefault(key) {
        return !this._document.config.hasOwnProperty(key);
    }

    get(key) {
        const { defaultValue, getter } = getSetting(key);
        const value = this._document.config[key] ?? defaultValue;
        return getter ? getter(value) : value;
    }

    set(key, value) {
        const { setter, getter } = getSetting(key);
        const storedValue = setter ? setter(value) : value;
        if (!deepEquals(storedValue, this._document.config[key])) {
            this._document.config[key] = storedValue;
            this.scheduleSave();
        }
        return getter ? getter(storedValue) : storedValue;

    }

    reset(key) {
        const { defaultValue, getter } = getSetting(key);
        if (this._document.config.hasOwnProperty(key)) {
            delete this._document.config[key];
            this.scheduleSave();
        }
        return getter ? getter(defaultValue) : defaultValue;
    }

    /**
     * A helper method for getting the default command prefix.
     * @returns {string}
     */
    get defaultPrefix() {
        return this.get('prefix').split(/\|/g)[0];
    }

    scheduleSave() {
        // Reset any existing timeout, to reduce database load.
        if (this._nextSaveTimeout) {
            clearTimeout(this._nextSaveTimeout);
            delete this._nextSaveTimeout;
        }
        // Create a new timeout, to save after a short delay.
        this._nextSaveTimeout = setTimeout(() => {
            delete this._nextSaveTimeout;
            this.save();
        }, 1500);
    }

    async save() {
        const updates = await database.set(this._document).catch(error => console.error(error));
        if (updates) this._document._rev = updates.rev;
    }
}

module.exports = GuildConfig;