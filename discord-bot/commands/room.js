const Room = require('../../classes/Room');
const { ReplyError, requireLobby, getLobbyInfoEmbed } = require('./_helpers');

module.exports = async function roomCommand(message, arguments) {
    // Make sure the user is in a channel, and we have access.
    const lobby = await requireLobby(message);

    const [code, region] = arguments;

    // If a code was provided, handle it.
    if (code) {
        // If the "code" is an unlist instruction, delete it and return.
        if (code.match(/unlist|delete|remove|private/i)) delete lobby.room;

        // Otherwise, store the new room code.
        else {
            // TODO Load this pattern from the schema, instead of hardcoding it.
            if (!code.match(/^[a-z]{6}$/i)) throw new ReplyError("That room code doesn't make sense.");
            lobby.room = new Room(code, region);
        }
    }

    // Respond with the lobby information.
    await message.channel.send(getLobbyInfoEmbed(lobby))
};