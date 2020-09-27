const Lobby = require('../../classes/Lobby');
const { ReplyError, requireLobby } = require('./_helpers');


module.exports = async function killCommand(message) {
    const lobby = await requireLobby(message);

    if (lobby.state === Lobby.STATE.INTERMISSION) throw new ReplyError("You can't kill people during intermission.");

    // Kill the at-mentioned players.
    await Promise.all(message.mentions.members.map(member => lobby.killPlayer(member)));
    // TODO Stop this from taking parameters, so it can be re-used.
    if (lobby.state === Lobby.STATE.MEETING) await lobby.postLobbyInfo({title: "Meeting!"})
};