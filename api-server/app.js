
const createError = require('http-errors');
const express = require('express');
const swaggerUI = require('swagger-ui-express');

// Initialize the app
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

// Mount on the server.
const server = require('../lib/server');
server.on('request', app);