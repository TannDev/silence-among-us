const createError = require('http-errors');
const { Router } = require('express');
const Lobby = require('../classes/Lobby');
const discordClient = require('../discord-bot/discord-bot');
const { capture } = require('../downloads');
const { version = 'Unreleased' } = require('../package.json');

// Initialize the server
const router = Router();

router.get('/', (req, res) => {
    discordClient.getGuildCount().then(guildsSupported => res.json({ version, guildsSupported }));
})

router.param('voiceChannelId', (req, res, next, voiceChannelId) => {
    Lobby.findByVoiceChannel(voiceChannelId)
        .then(lobby => {
            if (lobby) {
                req.lobby = lobby;
                next();
            }
            else next(createError(404, "No lobby exists for that voice channel."));
        })
        .catch(error => next(error));
});

router.param('playerId', (req, res, next, playerId) => {
    req.lobby.getDiscordPlayer(playerId)
        .then(player => {
            if (player) {
                req.player = player;
                next();
            }
            else next(createError(404, "No such player exists for that lobby."));
        })
        .catch(error => next(error));
});

router.get('/lobby/:voiceChannelId', (req, res) => {
    res.json(req.lobby.toJSON());
});

router.get('/lobby/:voiceChannelId/:playerId/kill', (req, res, next) => {
    req.lobby.guildMemberKill(req.player.guildMember)
        .then(player => res.json(player))
        .catch(error => next(error));
});

router.get('/capture/download', (req, res) => {
    res.download(capture.filepath, capture.filename);
})

router.use((req, res, next) => {
    next(createError(404, "No such API endpoint."));
});

router.use((error, req, res, next) => {
    if (!createError.isHttpError(error)) error = createError(error);
    console.error(error);
    res.status(error.status).json(error);
});

module.exports = router;