const path = require('path');
const YAML = require('yamljs');
const {version} = require('../package.json');

// Parse the schema yaml file.
const schema = YAML.load(path.join(__dirname, '../schema.yaml'));

// Update the version, if appropriate.
if (version) schema.info.version = version;

// Lock the schema.
Object.freeze(schema);

module.exports = schema;
