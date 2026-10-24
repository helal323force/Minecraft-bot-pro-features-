# Minecraft AFK Bot v3.0

Modular Mineflayer bot with a session-protected dashboard, Socket.IO updates, SQLite history, AI providers, optional Discord integration and deployment files for GitHub Actions, Railway and Render.

## Quick start

1. Use Node.js 20 or newer.
2. Extract the project and run `npm install`.
3. Copy `.env.example` to `.env`; set `DASHBOARD_PASSWORD` and a long random `SESSION_SECRET`.
4. Edit `settings.json`: set `server.ip`, `server.port`, `server.version`, and account username/type. For Microsoft-authenticated accounts, follow Mineflayer's auth flow rather than placing secrets in a committed file.
5. Add provider keys to `.env` if using AI. Set `ai.enabled` false if you do not want AI.
6. Run `npm start`, then open `http://localhost:3000`.
7. Verify syntax with `npm run check`.

The dashboard password falls back to `admin123` only for development if the environment variable is absent. Do not expose that configuration to the public internet. HTTPS is recommended for deployed instances.

## Environment variables

- `DASHBOARD_PASSWORD`: dashboard login password.
- `SESSION_SECRET`: persistent random secret for signed sessions.
- `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENAI_API_KEY`: optional AI providers.
- `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID`, `DISCORD_BRIDGE_CHANNEL_ID`: optional Discord bot and bridge.
- `MC_HOST`, `MC_PORT`, `MC_USERNAME`, `MC_PASSWORD`: optional environment values; server host/port currently come from `settings.json`.
- `RENDER_EXTERNAL_URL`: optional keepalive URL for `/ping`.

Never commit `.env`, API keys, bot credentials, or a production SQLite database.

## Feature configuration

### Dashboard and authentication
Socket.IO sends log, chat, status and task events. HTTP `/health` and `/ping` remain public for health checks. Other dashboard and API routes require login. Legacy `POST /start`, `/stop`, and `/command` are retained. `POST /command` accepts JSON `{ "command": "say hello", "account": "main" }`.

### AI chat
Enable `ai.enabled`, then set at least one provider key. Chat messages containing `.ai` followed by a question are handled; an empty `.ai` returns usage help. The AI adapter tries primary then fallback providers. Successful answers are cached for 60 seconds, stored in SQLite, and limited to one request per player per 10 seconds and 20 global requests per minute. Use `POST /api/ai/ask` for dashboard calls. AI provider APIs may change; keep SDKs updated.

### AI brain
`ai_brain.enabled` is off by default. Set it true and choose `tick_interval` and `max_requests_per_hour`. It submits situation snapshots and expects JSON decisions. Autonomous actions are intentionally conservative; test on a private world before enabling.

### Discord
Set `discord.enabled`, token, guild, allowed channel IDs and admin role IDs. The prefix commands are handled by discord.js v14. Enable Message Content Intent in the Discord Developer Portal. Create a bot role with only the permissions it needs. Webhook delivery from the old project can remain configured via `discord.webhookUrl`; this v3 core keeps webhook configuration but the Discord bot is separate.

### Gameplay modules
`modules.auto_mine`, `auto_farm`, `auto_fish`, `auto_chop`, `auto_trade` and `auto_build` are disabled by default. Trigger supported helpers through `POST /api/module/:name` with an optional account. Test in a throwaway world: pathfinding, block reach, server protection, inventory, game version and plugin behavior affect results. Trade opens a villager window for inspection; it does not blindly confirm purchases. Schematic upload currently validates/parses data and does not automatically place an entire schematic.

### Tracker, backups and scheduler
Player sessions and AI logs are persisted to `data/bot.sqlite`. Backups are written every five minutes while a bot is spawned. `GET /api/players/history?username=Steve`, `GET /api/backups`, and `/api/tasks` expose history. Scheduler supports cron or delay-based tasks; task actions include command, say, walk-to and brain toggles.

### Plugin loader
Put trusted plugins in `plugins/` and export `module.exports = { name, version, init(bot, context) {} }`. Plugins execute as Node.js code and have the same process permissions; audit them first.

### Proxy and auto-update
Proxy selection helper and update checker are included, but proxy injection into Mineflayer varies by protocol/auth mode and must be tested with your exact server. Managed hosts should be redeployed through their Git integration; the update checker intentionally does not pull code automatically on Render/Railway.

## Deploying

### GitHub Actions
The included `.github/workflows/check.yml` installs dependencies and checks syntax on push/PR. GitHub Actions runners are temporary CI machines, not a reliable 24/7 bot host. Do not use a workflow loop to evade runner time limits.

### Railway
Push this repository to GitHub, create a Railway project from the repo, set environment variables, and use `npm start`. Add persistent volume storage and mount it to the app data directory if you need SQLite history to survive redeploys. Use Railway's current supported Node runtime and health check `/health`.

### Render
Create a Web Service from the GitHub repository, set build command `npm install`, start command `npm start`, and health check path `/health`. Set the environment variables in the Render dashboard. Persistent disks may require a paid service tier and should be mounted where `data/bot.sqlite` is stored. Free instances may sleep or have usage limitations; `/ping` self-pinging is not a guarantee of 24/7 uptime.

## Assumptions and limitations

- Existing `leaveRejoin.js` and `launcher_accounts.json` are preserved; they are not automatically imported because their behavior is independent of the new account lifecycle.
- Mineflayer support depends on actual Minecraft protocol versions and installed server software. The supplied source project used older Minecraft configuration; update `server.version` to a protocol version supported by the installed Mineflayer/minecraft-data packages.
- Some advanced requests are inherently server-dependent. Automated full schematic placement, precise combat/PvP attribution, robust auto-trade selection, proxy injection, push notifications, and production analytics require dedicated integration tests and may need adaptation to the server and plugin environment. Do not assume these are fully production-validated from syntax checks alone.
- Socket.IO status is event-based and also refreshed once per second. Inventory snapshots and deep historical charts need additional telemetry if required.
- Multi-account state is represented by `settings.accounts`; use separate server-approved accounts and follow the Minecraft server's rules.
- The dashboard is not intended to be exposed without HTTPS, strong credentials and firewalling.

## Testing checklist

- [ ] `npm install`
- [ ] `node --check index.js`
- [ ] `node --check logger.js`
- [ ] Bot connects and spawns on a supported server
- [ ] Dashboard loads at `/` after login
- [ ] Socket.IO connects (`socket connected` in browser console)
- [ ] Start/Stop works from dashboard
- [ ] Live chat appears on dashboard
- [ ] In-game `.ai hello` gets an AI reply
- [ ] In-game `test .ai what is your name` triggers AI
- [ ] Discord prefix commands work with allowed roles
- [ ] Discord bridge works in configured channel
- [ ] Auto-mine works in a test world when enabled
- [ ] Task scheduler triggers a cron/delay task
- [ ] Player join/leave is logged to SQLite
- [ ] Analytics chart renders
- [ ] Stop/start has no duplicate timers or ghost listeners
- [ ] Memory remains stable over a 30-minute test
- [ ] Login is required for all protected routes
