const createError = require('http-errors');
const { Router } = require('express');
const Lobby = require('../classes/Lobby');

// Initialize the server
const router = Router();

router.param('voiceChannelId', (req, res, next, voiceChannelId) => {
    Lobby.find(voiceChannelId)
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
    req.lobby.getPlayer(playerId)
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
    req.lobby.killPlayer(req.player.member)
        .then(player => res.json(player))
        .catch(error => next(error));
});

router.use((req, res, next) => {
    next(createError(404, "No such API endpoint."));
});

router.use((error, req, res, next) => {
    if (!createError.isHttpError(error)) error = createError(error);
    console.error(error);
    res.status(error.status).json(error);
});

module.exports = router;