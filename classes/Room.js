// TODO Load this from the schema.
const codePattern = /^[a-z]{6}$/i;

class Room {
    constructor({code, region}) {
        if (typeof code !== 'string' || !code.match(codePattern)) throw new Error("That room code doesn't make sense");
        else code = code.toUpperCase();

        // Map possible region parameters.
        switch(region && region.toLowerCase && region.toLowerCase()){
            case 'na':
            case 'us':
            case 'north':
            case 'america':
            case 'north america':
                region = 'North America'
                break;
            case 'eu':
            case 'europe':
                region = 'Europe';
                break;
            case 'as':
            case 'asia':
                region = 'Asia'
                break;
            default:
                // If no match occurred because the parameter was missing/invalid, assume NA.
                if (!region || typeof region !== 'string') region = 'North America';

                // Otherwise, accept the value provided, for future-proofing.
        }

        this.code = code;
        this.region = region;
        Object.freeze(this);
    }

    toString() {
        return `${this.code} (${this.region})`;
    }
}

module.exports = Room;