const { ReplyError, requireLobby, deleteMessage, getLobbyInfoEmbed } = require('./_helpers');


module.exports = async function meetingCommand(message) {
    const lobby = await requireLobby(message);
    await deleteMessage(message);

    // Don't accept duplicate commands.
    if (lobby.state === 'meeting') throw new ReplyError("Your lobby is already in a meeting.");

    // Transition
    await lobby.transition('meeting')
    await message.channel.send(getLobbyInfoEmbed(lobby, {title: "Meeting Started!"}))

    // TODO Play audio
};