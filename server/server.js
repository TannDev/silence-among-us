const createError = require('http-errors');
const express = require('express');
const swaggerUI = require('swagger-ui-express');

// Initialize the server
const app = express();

// Serve swagger UI/
app.use(swaggerUI.serve);
app.get('/', swaggerUI.setup(require('../lib/loadSchema')));

// Mount the API.
app.use('/api', require('./api'));

// Fail on anything else.
app.use((req, res, next) => {
    next(createError(404));
})

// Listen
const server = app.listen(process.env.PORT || 3000, (error) => {
    const { port } = server.address();
    console.log(`Listening on http://localhost:${port}`);
});