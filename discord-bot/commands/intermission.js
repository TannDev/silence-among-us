const { requireLobby } = require('./_helpers');


module.exports = async function intermissionCommand(message) {
    const lobby = await requireLobby(message);
    await lobby.transition('Intermission');
};