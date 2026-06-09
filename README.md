# TI4 Blind Draft Bot

A Discord bot for running blind faction drafts for Twilight Imperium 4th Edition. Randomly assigns factions into pools and lets players privately view their assigned pool.

## Setup

### Prerequisites

1. Go to https://discord.com/developers/applications and create a **New Application**
2. In your application, go to **Bot** → "Privileged Gateway Intents" and enable **Server Members Intent**

### Environment Variables

Create a `.env` file from the template:

```bash
cp .env.example .env
```

Then fill in each value using the instructions below.

#### DISCORD_TOKEN

1. Go to https://discord.com/developers/applications and click your application
2. Click **Bot** in the left sidebar
3. Under the "Token" section, click **Reset Token** (if no token exists, you'll see a button to generate one)
4. Copy the token and paste it into `.env` as `DISCORD_TOKEN`

#### DISCORD_CLIENT_ID

1. In the same Discord Developer Portal, click **General Information** in the left sidebar
2. Under "Application ID", click **Copy**
3. Paste it into `.env` as `DISCORD_CLIENT_ID`

#### DISCORD_GUILD_ID

1. Open Discord and go to your User Settings (gear icon)
2. Scroll to **Advanced** and enable **Developer Mode**
3. Right-click your server's icon in the server list and click **Copy Server ID**
4. Paste it into `.env` as `DISCORD_GUILD_ID`

#### Inviting the Bot to Your Server

1. In the Developer Portal, click **OAuth2** in the left sidebar
2. Under "Scopes", check **bot** and **applications.commands**
3. Under "Bot Permissions", check **Send Messages**, **Use Slash Commands**, and **Read Messages/View Channels**
4. Copy the generated URL at the bottom and open it in your browser
5. Select your server and click **Authorize**

> **Important:** The bot requires the **Server Members Intent**. Go to **Bot** → "Privileged Gateway Intents" and enable it before running the bot.

### Local Development

```bash
pnpm install
pnpm run deploy-commands   # Register slash commands
pnpm run dev               # Run bot in watch mode (tsx)
```

### Docker

```bash
# Build
docker build -t ti4-draft-bot .

# Run (with data persisted to host)
docker run -d --name ti4-draft-bot \
    --env-file .env \
    -v $(pwd)/data:/app/data \
    ti4-draft-bot

# Register commands after container starts
docker exec ti4-draft-bot node dist/deploy-commands.js
```

## Commands

### `/create-draft [name]`

Creates a new blind draft. The bot will:

1. Ask you to select which server members will participate (multi-select dropdown)
2. Ask how many faction options each player gets (max = total factions ÷ number of players, recommended is the max to divide all factions equally)
3. Randomly split factions into pools and assign each player to a pool

### `/view-pool`

View your assigned faction pool for a draft you're participating in. Only visible to you.

### `/delete-draft`

Delete a draft you created. Requires confirmation.

## How It Works

1. The bot reads the faction list from `data/factions.json`
2. When a draft is created, factions are shuffled and split into equal pools
3. Each player is randomly assigned to a pool
4. All draft data is stored in `data/drafts.json`
5. Players use `/view-pool` to privately see their assigned factions

## Data Files

| File                 | Purpose                                                   |
| -------------------- | --------------------------------------------------------- |
| `data/factions.json` | Static faction list (Base + PoK + Thunder's Edge + Codex) |
| `data/drafts.json`   | Active drafts (created at runtime)                        |

## Project Scripts

| Script                 | Purpose                                     |
| ---------------------- | ------------------------------------------- |
| `pnpm dev`             | Run bot in development mode with hot-reload |
| `pnpm build`           | Bundle with esbuild for production          |
| `pnpm deploy-commands` | Register slash commands with Discord        |
| `pnpm start`           | Run the production build                    |
| `pnpm format`          | Format all files with Prettier              |
| `pnpm format:check`    | Check formatting without writing            |
