const Nano = require('nano');

const nano = Nano(process.env.SAU_DB_URL || 'http://sau-bot:local-development@localhost:5984');
const db = nano.db.use('users');

// TODO Create databases automatically.

class User {
    static async load(userId) {
        const document = await db.get(userId).catch(error => {
            if (error.reason !== 'missing') console.error(error);
            return {_id: userId};
        });
        return new User(document);
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
        const {rev, ...rest} = db.insert(this._document).catch(error => {
            this._document._rev = rev;
            console.log(rest);
        });
    }
}

module.exports = User;