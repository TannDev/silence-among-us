class Room {
    constructor(code, region) {
        // Handle the code parameter.
        if (!code || typeof code !== 'string') code = 'None';
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