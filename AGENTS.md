# AGENTS.md

## Project

TI4 Blind Draft Bot — a Discord bot for Twilight Imperium 4th Edition blind faction drafts.

## Tech Stack

- **Runtime:** Node.js 22 LTS
- **Language:** TypeScript (strict mode, ESM)
- **Package manager:** pnpm
- **Discord library:** discord.js v14
- **Bundler:** esbuild (for production builds)
- **Dev runner:** tsx (for development)
- **Formatter:** Prettier (double quotes, 4 spaces, trailing commas)

## Commands

```bash
pnpm install              # Install dependencies
pnpm run dev              # Run bot in dev mode with hot-reload (tsx watch)
pnpm run build            # Bundle with esbuild → dist/
pnpm run deploy-commands  # Register guild slash commands
pnpm run start            # Run the production build (node dist/index.js)
pnpm run format           # Format all files with Prettier
pnpm run format:check     # Check formatting without writing
```

### TypeScript Check

```bash
pnpm exec tsc --noEmit
```

## Architecture

```
src/
├── index.ts              # Client init, interaction handler routing
├── deploy-commands.ts    # Guild slash command registration script
├── commands/
│   ├── create-draft.ts   # /create-draft — 3-step (player select → options select → confirm)
│   ├── view-pool.ts      # /view-pool — 2-step (draft select → show pool)
│   └── delete-draft.ts   # /delete-draft — 3-step (draft select → confirm → delete)
├── utils/
│   ├── data.ts           # JSON file read/write for drafts.json
│   ├── draft.ts          # Core logic: shuffle, split factions, create draft
│   └── pending.ts        # In-memory Map for multi-step draft creation state
└── types.ts              # Draft interface
```

## Conventions

- All files use ESM (`import`/`export`, `.js` extensions in relative imports)
- `"type": "module"` in package.json
- Run Prettier before committing: `pnpm run format`
- Env vars: `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_GUILD_ID` (loaded via `--env-file=.env`)
- Data files live in `data/` directory (mounted as Docker volume)
- Ephemeral replies used for all private interactions
- Multi-step interactions use `src/utils/pending.ts` in-memory Map keyed by UUID

## Deployment

1. Set `.env` with bot token, client ID, guild ID
2. `docker build -t ti4-draft-bot .`
3. `docker run -d --name ti4-draft-bot --env-file .env -v $(pwd)/data:/app/data ti4-draft-bot`
4. `docker exec ti4-draft-bot node dist/deploy-commands.js`
