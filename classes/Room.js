const { components: { schemas: { Room: schema } } } = require('../lib/loadSchema');
const validate = require('../lib/getSchemaValidator')('Room', schema);

class Room {
    constructor(code, region = 'North America') {
        this.code = code;
        this.region = region;
        validate(this);
        Object.freeze(this);
    }

    toJSON() {
        return `${this.code} (${this.region})`;
    }
}

module.exports = Room;