const crypto = require('crypto');
const algorithm = 'sha256';
const secret = crypto.randomBytes(32); // TODO Load this key from environment

module.exports = async function authCommand(message) {
    // Get the user's unique ID from the message.
    const userId = message.author.id;

    // Encrypt the id.
    const hmac = crypto
        .createHmac(algorithm, secret)
        .update(userId)
        .digest('hex');

    const shortcode = hmac.substring(0, 8).toUpperCase();

    const dmChannel = await message.author.createDM();
    dmChannel.send(`Give this to your Capture Client: \`${shortcode}\``);
};
