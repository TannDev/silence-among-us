const server = require('http').createServer();

const secure = process.env.SAU_SECURE === 'true';
const protocol = secure ? 'https' : 'http';
const defaultPort = secure ? '443' : '80';
const port = process.env.SAU_PORT || defaultPort;
const host = process.env.SAU_HOST || 'localhost';
const uri = port === defaultPort ? host : `${host}:${port}`;
const url = `${protocol}://${uri}`;

server.listen(port, (error) => {
    const { port } = server.address();
    console.log(`Listening on ${url}`);
});

module.exports = { server, url, uri, host, port, secure };