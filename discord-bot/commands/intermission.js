const { ReplyError, requireLobby, deleteMessage, getLobbyInfoEmbed } = require('./_helpers');


module.exports = async function intermissionCommand(message) {
    const lobby = await requireLobby(message);
    await deleteMessage(message);

    // Don't accept duplicate commands.
    if (lobby.state === 'intermission') throw new ReplyError("Your lobby is already in intermission.");

    // Transition
    await lobby.transition('intermission')
    await message.channel.send(getLobbyInfoEmbed(lobby, {title: "Game Over!"}))

    // TODO Play audio
};