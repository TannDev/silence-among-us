const { requireLobby } = require('./_helpers');


module.exports = async function meetingCommand(message) {
    const lobby = await requireLobby(message);
    await lobby.transition('meeting')
};