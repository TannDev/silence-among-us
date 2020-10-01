const io = require('socket.io')();
const Lobby = require('../classes/Lobby');

const STATES = [
    'LOBBY',
    'TASKS',
    'DISCUSSION',
    'MENU'
]

const STATE_MAP = {
    LOBBY: Lobby.PHASE.INTERMISSION,
    TASKS: Lobby.PHASE.WORKING,
    DISCUSSION: Lobby.PHASE.MEETING,
    MENU: Lobby.PHASE.INTERMISSION
}

const COLORS = [
    'Red',
    'Blue',
    'Green',
    'Pink',
    'Orange',
    'Yellow',
    'Black',
    'White',
    'Purple',
    'Brown',
    'Cyan',
    'Lime'
]

io.on('connection', client => {
    client.on('connect', connectCode => {{
        Lobby.findByConnectCode(connectCode)
            .then(async lobby => {
                if (!lobby) throw new Error(`No matching lobby for connect code: ${connectCode}`)
                client.connectCode = connectCode;
                await lobby.updateAutomationConnection(true);
                console.log(`SocketIO: Connected code: ${connectCode}`);
            })
            .catch(error => console.error(error));
    }});

    client.on('state', index => {
        const state = STATES[index]
        const targetPhase = STATE_MAP[state];

        // Get the lobby
        const { connectCode } = client;
        Lobby.findByConnectCode(connectCode)
            .then(async lobby => {
                if (!lobby) return;
                console.log(`SocketIO: State update for ${connectCode}:`, state);

                // Handle the menu state differently, by deleting the room.
                if (state === 'MENU') delete lobby.room;

                if (lobby.phase === targetPhase) return;
                await lobby.transition(targetPhase);
            })
            .catch(error => console.error(error));
    });

    client.on('player', data => {
        // Get the lobby
        const { connectCode } = client;
        Lobby.findByConnectCode(connectCode)
            .then(async lobby => {
                if (!lobby) return;
                console.log(`SocketIO: Player update for ${connectCode}:`, data);
                const {Name, IsDead, Disconnected, Color} = JSON.parse(data);
                const update = {
                    name: Name,
                    color: COLORS[Color],
                    kill: Boolean(IsDead),
                    disconnect: Boolean(Disconnected)
                }
                // TODO Post the update somewhere.
                console.log(`Would Update:`, update);
            })
            .catch(error => console.error(error));
    });

    client.on('disconnect', () => {
        const { connectCode } = client;
        Lobby.findByConnectCode(connectCode)
            .then(async lobby => {
                if (!lobby) return;
                console.log(`SocketIO: Disconnected code: ${connectCode}`);
                await lobby.updateAutomationConnection(false);
            })
            .catch(error => console.error(error));
    });
});

// TODO Make port configurable
io.listen(8123);

module.exports = io;
