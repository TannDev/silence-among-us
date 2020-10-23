const crypto = require('crypto');
const Database = require('./Database');
const database = new Database('users');

class UserConfig {
    static async load(userId) {
        if (!userId) throw new Error("Can't look up a user config without a user id.");
        const hash = crypto
            .createHash('sha256')
            .update(userId)
            .digest('hex');
        const documentId = `user:${hash}`;

        // TODO Remove this upgrade logic.
        const [document, legacyDocument] = await Promise.all([
            database.get(documentId).catch(error => console.error(error)),
            database.get(userId).catch(error => console.error(error))
        ]);
        if (legacyDocument) {
            await database.delete(legacyDocument);
            legacyDocument._id = documentId;
            delete legacyDocument._rev;
            const userConfig = new UserConfig(legacyDocument);
            await userConfig.save();
            return userConfig;
        }

        return new UserConfig(document ?? { _id: documentId });
    }

    constructor({ ...document }) {
        this._document = document;
    }

    get amongUsName() { return this._document.amongUsName; }

    async updateAmongUsName(amongUsName) {
        if (amongUsName === this.amongUsName) return;
        this._document.amongUsName = amongUsName;
        await this.save();
    }

    // TODO Apply settings.

    get isSaved() {
        return Boolean(this._document._rev);
    }

    async save() {
        const updates = await database.set(this._document).catch(error => console.error(error));
        if (updates) this._document._rev = updates.rev;
    }

    async delete() {
        // Delete the database record.
        if (this.isSaved) await database.delete(this._document);

        // Erase all the settings in the document.
        this._document = { _id: this._document._id };
    }

    toJSON() {
        const { _id, _rev, ...json } = this._document;
        return json;
    }
}

module.exports = UserConfig;