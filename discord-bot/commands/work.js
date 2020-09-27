const { requireLobby } = require('./_helpers');


module.exports = async function workingCommand(message) {
    const lobby = await requireLobby(message);
    await lobby.transition('working')
};