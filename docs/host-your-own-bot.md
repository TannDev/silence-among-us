# Host Your Own Bot
If you'd like to run your own dedicated bot, rather than rely on ours, you can easily host your own!

The bot runs via docker-compose and includes everything it needs in order to run.
First, though, you'll need to create a new Discord application and set up some environment variables.

## Create a Discord Application
Before you can run your own bot, you'll need to create a Discord application.
1. Go the [Discord Developer Portal](https://discord.com/developers/applications)
1. Create an account, if you don't have one already.
1. Click "New Application", pick a suitable name, and click "create".
1. Click "Bot" on the left side, next to the puzzle piece icon.
1. Click "Add Bot"
1. Copy the bot's token and save it **securely**. This is your `DISCORD_TOKEN` for later.
1. Click "OAuth2" on the left side, next to the wrench icon.
1. Under "Scopes", check "bot" and then the following bot permissions:
    - General Permissions: Manage Nicknames
    - General Permissions: View Channels
    - Text Permissions: Send Messages
    - Text Permissions: Manage Messages
    - Text Permissions: Embed Links
    - Voice Permissions: Connect
    - Voice Permissions: Speak
    - Voice Permissions: Mute Members
    - Voice Permissions: Deafen Members
1. Click "Copy" next to the URL generated under "Scopes".
1. Paste the link into the address bar of a new tab, to authorize your app for your server.
1. Take the bot token you generated earlier and configure your bot with the instructions below.

## Environment Variables
The bot uses a couple environment variables:
- `DISCORD_TOKEN`: The bot token for your Discord application. (Required)
- `DATABASE_USERNAME`: The username for the bundled (or remote) CouchDB database. (Required)
- `DATABASE_PASSWORD`: The password for the bundled (or remote) CouchDB database. (Required)
- `PORT`: Which port the API app should listen on. (Default: '8080')
- `HOST`: The _external_ host where the server will listen. (Default: 'localhost:${PORT}')
- `SECURE`: Whether the bot is available via HTTPS. (Default: 'false')

_Note:_ The server doesn't include SSL natively, but can be placed behind an appropriate proxy such as nginx.
In this case, set `PORT` to the _actual_ port used by the server, but set `HOST` and `SECURE` to the values that your users will use.
See the section on [securing your bot](#securing-your-bot) for more details about this.

You should declare these in a `.env` file wherever your bot will run:
```
DISCORD_TOKEN=HERE
DATABASE_USERNAME=HERE
DATABASE_PASSWORD=HERE
HOST=localhost
PORT=8080
SECURE=false
```
Of course, you should replace `HERE` with actual values and change the other values to suit your environment.

## Run via Docker-Compose
We've designed the bot to run with Docker Compose, along with the CouchDB database that it uses.
If you've set up your `.env` file correctly, you can use the [default docker-compose file](/docker-compose.yaml).

1. Put your `.env` and the `docker-compose.yaml` files in the same directory.
1. In that directory, use `docker-compose up -d` to run the bot and database.
    - To shut it down, use `docker-compose down`.
    - To see what the bot is doing, use `docker-compose logs --follow sau`. (No cheating!)
    - If you want to get rid of the database and start over, use `docker-compose down -v`.
1. If you need to update, run `docker-dompose pull && docker-compose up -d`.

_Note:_ Unfortunately, we can't provide support for users that are unfamiliar with Docker or Docker Compose. 

## Where to Host
The easiest way to run the bot is by using Docker Desktop on your computer and connecting the capture app via localhost.

However, if you want an always-on solution -- or to allow other people to connect the capture app -- then you'll need to host it somewhere else.
We use a [DigitalOcean](https://www.digitalocean.com/) droplet for the [early-access bot](https://sau.tanndev.com) and will include some helpful setup guides for that later, if there's interest.

## Securing Your Bot
By default, the bot doesn't use any form of encryption, and communicates openly via HTTP.
This isn't ideal if you're hosting your bot on the internet somewhere. You _definitely_ don't want your database exposed.

We **strongly** recommend running your bot behind a secure proxy, such as NGINX.

Check out DigitalOcean's excellent [tutorial on the subject](https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-20-04).

There're several steps required to get this working (again, you should read that tutorial), but here's the configuration we wound up with.

NGINX Site:
```
# API/Capture Server
server {
    server_name sau.tanndev.com;

    location / {
            proxy_pass http://localhost:8080;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
    }

    listen [::]:443 ssl ipv6only=on; # managed by Certbot
    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/sau.tanndev.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/sau.tanndev.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

# HTTP => HTTPS API/Capture Redirect
server {
    server_name sau.tanndev.com;
    listen 80;
    return 301 https://$host$request_uri;
}

# Database
server {
    server_name sau.tanndev.com;

    location / {
            proxy_pass http://localhost:5984;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
    }

    listen [::]:6984 ssl ipv6only=on; # managed by Certbot
    listen 6984 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/sau.tanndev.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/sau.tanndev.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}
```

UFW config:
```
Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), deny (routed)
New profiles: skip

To                              Action      From
--                              ------      ----
22/tcp (OpenSSH)                ALLOW IN    Anywhere
80,443/tcp (Nginx Full)         ALLOW IN    Anywhere
6984                            ALLOW IN    Anywhere
22/tcp (OpenSSH (v6))           ALLOW IN    Anywhere (v6)
80,443/tcp (Nginx Full (v6))    ALLOW IN    Anywhere (v6)
6984 (v6)                       ALLOW IN    Anywhere (v6)
```

Of course, this is all just friendly advice. Ultimately, **you** are responsible for your own security.
If you're not comfortable setting up a secure server, then you might want to consider [using ours](README.md#quickstart-guide) instead.