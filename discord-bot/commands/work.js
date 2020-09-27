const { ReplyError, requireLobby } = require('./_helpers');


module.exports = async function workingCommand(message) {
    const lobby = await requireLobby(message);

    // Don't accept duplicate commands.
    if (lobby.transitioning) throw new ReplyError("Your lobby is already changing states.");
    if (lobby.state === 'working') throw new ReplyError("Your lobby is already working on tasks.");

    // Transition
    await lobby.transition('working')
    await lobby.postLobbyInfo({title: "Get to Work!"})

    // TODO Play audio
};