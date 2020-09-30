const io = require('socket.io')();
const Lobby = require('../classes/Lobby');

const STATE = [
    'Intermission',
    'Working',
    'Meeting',
    'Menu'
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
        const targetPhase = STATE[index]

        // Get the lobby
        const { connectCode } = client;
        Lobby.findByConnectCode(connectCode)
            .then(async lobby => {
                if (!lobby) return;
                console.log(`SocketIO: Received state for ${connectCode}:`, targetPhase);
                if (lobby.phase === targetPhase) return;
                await lobby.transition(targetPhase);
            })
            .catch(error => console.error(error));
    });

    client.on('player', data => {
        // TODO Update player status
        console.log('player:', data);
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
