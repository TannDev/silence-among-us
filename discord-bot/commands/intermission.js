const { ReplyError, requireLobby } = require('./_helpers');


module.exports = async function intermissionCommand(message) {
    const lobby = await requireLobby(message);

    // Don't accept duplicate commands.
    if (lobby.transitioning) throw new ReplyError("Your lobby is already changing states.");
    if (lobby.state === 'intermission') throw new ReplyError("Your lobby is already in intermission.");

    // Transition
    await lobby.transition('intermission')
    await lobby.postLobbyInfo({title: "Game Over!"})

    // TODO Play audio
};