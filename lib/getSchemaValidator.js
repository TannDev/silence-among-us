const Ajv = require('ajv');

/**
 * AJV instance for validating schemas.
 * @type {ajv.Ajv}
 */
const ajv = new Ajv({
    allErrors: true,
    verbose: true,
    nullable: true
});

/**
 * Generates a validation function against the given schema.
 *
 * When used, the validation function will throw an error if the given object doesn't match the given spec.
 *
 * @param {string} name - Name of the object type to report in errors.
 * @param {object} schema - Valid JSON schema to compare against.
 * @returns {function(object): void | *}
 */
module.exports = function getValidator(name, schema) {
    const validator = ajv.compile(schema);

    // Generate a validation function.
    const validate = function validate(object) {
        const valid = validator(object);
        if (!valid) {
            const errors = validator.errors.map(error => error.message);
            throw new Error(`Invalid ${name}: \n- ${errors.join('\n- ')}`);
        }
    }

    // If the schema has properties, nest additional validators onto this one.
    if (schema.properties) Object.keys(schema.properties).reduce((map, key) => {
        map[key] = getValidator(`${name}.${key}`, schema.properties[key]);
        return map;
    }, validate)

    // Return the nested function(s).
    return validate;
};