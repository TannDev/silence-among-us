const server = require('http').createServer();

server.listen(process.env.PORT || 8080, (error) => {
    const { port } = server.address();
    console.log(`Listening on http://localhost:${port}`);
});

module.exports = server;