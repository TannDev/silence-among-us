const path = require('path');
const RefParser = require('@apidevtools/json-schema-ref-parser');

// Load the schema asynchronously.
console.log("Loading schema...")
let schema;
RefParser.dereference(path.join(__dirname, '../schema.yaml'))
    .then(loaded => {schema = loaded})
    .catch(error => {
        console.error('Failed to load schema:', error);
        process.exit(1);
    })

// Wait for the schema to be loaded before continuing synchronously.
require('deasync').loopWhile(() => !schema);

module.exports = schema;
