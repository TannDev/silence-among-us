# Per-Server Configuration
You can configure some settings on a per-server basis.

The `config` command will let you get, set, and reset options:
- `!sau config get <option>`: Get the current value of the option.
- `!sau config set <option> <value`: Set a new value for the option.
- `!sau config reset <option>`: Reset the value of the option back to the default.

_Note:_ Each deployed instance of the bot uses a different settings database.

## Prefix
- **Default:** `!sau|!s`
- **Example:** `!sau config set prefix !sau|!s`

The `prefix` option allows you to change which prefixes the bot listens to.

If you want to set multiple options, you can separate prefixes with spaces or `|`.

If you want to run multiple instances of the bot, you'll need to set each of them to listen on a different prefix. This can be tricky, if they're all in a channel together already. But it can be fixed:
1. First, add one of the instances to a private text channel without the others.
1. In that private channel, change its prefix with `!sau config set prefix <new prefixes>`.
1. Then, add the next bot to the private channel and change its prefix.
1. Repeat this as many times as needed to make all the instances different

To make test them, you can use `!sau-rollcall` in a channel with all of them, to make sure they have unique prefixes.

## Auto-join
- **Default:** `true`
- **Valid Options:** `on`, `off`, `true`, `false`
- **Example:** `!sau config set autojoin off`

With this feature enabled, discord users spectating an automated lobby will be automatically joined to the lobby if their saved in-game name matches an unlinked player from the capture. This auto-join is done whenever a user connects to the voice channel _and_ whenever the capture reports a new player has connected to the game. So users can connect to the game and discord in either order.

Use `!sau config set autojoin off` to disable this feature for your server.

## Speech
- **Default:** `true`
- **Valid Options:** `on`, `off`, `true`, `false`
- **Example:** `!sau config set speech off`

With this feature enabled, the bot will play spoken announcements in the voice channel if it has the permissions to do so.

Use `!sau config set speech off` to disable this feature for your server.