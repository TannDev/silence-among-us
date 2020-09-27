const { ReplyError, requireLobby } = require('./_helpers');


module.exports = async function meetingCommand(message) {
    const lobby = await requireLobby(message);

    // Don't accept duplicate commands.
    if (lobby.transitioning) throw new ReplyError("Your lobby is already changing states.");
    if (lobby.state === 'meeting') throw new ReplyError("Your lobby is already in a meeting.");

    // Transition
    await lobby.transition('meeting')
    await lobby.postLobbyInfo()

    // TODO Play audio
};