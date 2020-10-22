require("dotenv").config();
const Nano = require('nano');

// Connect to the database.
const databaseUsername = process.env.DATABASE_USERNAME;
const databasePassword = process.env.DATABASE_PASSWORD;
const defaultDatabaseUrl = `http://${databaseUsername}:${databasePassword}@localhost:5984`;
const nano = Nano(process.env.DATABASE_URL ?? defaultDatabaseUrl);

class Database {
    constructor(databaseName){
        this._db = nano.db.use(databaseName);
        this._ready = nano.db.get(databaseName)
            .catch(async error => {
                // If the database doesn't exist, try to create it.
                if (error.reason === 'Database does not exist.') {
                    console.log(`Creating missing '${databaseName}' database...`)
                    await nano.db.create(databaseName);
                    return this._db.info();
                }

                // Otherwise, re-throw the error.
                throw error;
            })
            .catch(error => {
                // If any errors reach this point, log and exit.
                console.error('Fatal database error:', error);
                process.exit(1);
            })
            .then(info => {
                // TODO Create any necessary design docs.
                console.log(`Connected to '${info.db_name}' database.`)
            })
    }

    get ready() {
        return this._ready;
    }

    /**
     * Get a document out of the database.
     *
     * @param {string} id - ID of the document.
     * @returns {Promise<{_id: string, _rev: string}>}
     */
    async get(id){
        await this.ready;
        return await this._db.get(id).catch(error => {
            // If the document doesn't exist, return null.
            if (error.reason === 'missing' || error.reason === 'deleted') return null;

            // Otherwise, throw the error.
            throw error;
        });
    }

    async getAll(){
        await this.ready;
        const results = await this._db.list({include_docs: true});
        return results.rows.map(row => row.doc);
    }

    /**
     * Set a document in the database.
     *
     * @param {object} document - Document full of data to store.
     * @param {string} [document._id] - ID of the document. (Default: generated UUID)
     * @param {string} [document._rev] - Revision of the document. (Required if replacing a document.)
     * @returns {Promise<{ok: boolean, id: string, rev: string}>}
     */
    async set(document){
        await this.ready;
        return this._db.insert(document);
    }

    /**
     *
     * @param {string} _id - ID of the document.
     * @param {string} _rev - Revision of the document.
     * @returns {Promise<{ok: boolean}>}
     */
    async delete({_id, _rev}){
        await this.ready;
        return this._db.destroy(_id, _rev);
    }
}

module.exports = Database;