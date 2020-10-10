const Database = require('./Database');
const database = new Database('users');

class User {
    static async load(userId) {
        const document = await database.get(userId).catch(error => console.error(error));
        return new User(document || { _id: userId });
    }

    constructor(document) {
        this._document = document;
    }

    get id() { return this._document._id; }

    get amongUsName() { return this._document.amongUsName; }

    async updateAmongUsName(amongUsName) {
        if (amongUsName === this.amongUsName) return;
        this._document.amongUsName = amongUsName;
        await this.save();
    }

    // TODO Apply settings.

    async save() {
        const updates = await database.set(this._document).catch(error => console.error(error));
        if (updates) this._document._rev = updates.rev;
    }
}

module.exports = User;