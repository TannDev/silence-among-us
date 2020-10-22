const Command = require('.');
const Room = require('../../classes/Room');

module.exports = new Command({
    aliases: ['room'],
    options: '< unlist | <code> [na|eu|asia] >',
    description: 'Update or remove the room code.',
    category: 'manual',
    handler: async function() {
        // Load properties from the command context.
        const { arguments } = this;
        const lobby = await this.requireLobby();

        // Get the room code.
        const [code, region] = arguments.split(/\s+/g);
        if (!code) throw new Error("You must provide a room code, or `unlist` to remove the current one.")

        // Update the room.
        if (code.match(/^unlist|remove|x$/i)) lobby.room = null;
        else lobby.room = new Room({ code, region });
    }
});