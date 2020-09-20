const createError = require('http-errors');
const express = require('express');
const swaggerUI = require('swagger-ui-express');
const schemaParser = require('@apidevtools/json-schema-ref-parser');

// Initialize the server
const app = express();

// Serve swagger UI
const apiSpecPromise = schemaParser.bundle('./schemas/api.yaml');
app.use(swaggerUI.serve);
app.use('/',
    (req, res, next) => {
        apiSpecPromise
            .then(schema => {
                req.swaggerDoc = schema;
                next();
            })
            .catch(error => next(createError(500, error)));
    },
    swaggerUI.setup()
);


// Listen
const server = app.listen(process.env.PORT || 3000, (error) => {
    const { port } = server.address();
    console.log(`Listening on http://localhost:${port}`);
});