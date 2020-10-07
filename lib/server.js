const server = require('http').createServer();

const secure = process.env.SECURE === 'true';
const port = process.env.PORT || '8080';
const host = process.env.HOST || `localhost:${port}`;
const url = `http${secure ? 's' : ''}://${host}`;

server.listen(port, (error) => {
    if (error){
        console.error(error);
        process.exit(1);
    }
    console.log(`Listening on ${url} (http://localhost:${port}`);
});

module.exports = { server, url, host, port, secure };