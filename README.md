# MafiaBot

A Discord bot for hosting and running **Mafia** party-game events across multiple servers.
Handles game creation, player registration, role distribution, day/night cycles, voting, and post-game cleanup — all coordinated through slash commands and message interactions.

Built on **Node.js**, **discord.js v14**, and **MongoDB**.

---

## Features

- Multiple game modes: **City**, **London**, **Newbies**, **Web**.
- Automatic allocation of a free Discord server from a pool for each game.
- Player registration via reactions and buttons.
- Role management (host, don, mafia, doctor, commissar, civilian).
- Day/night state machine with per-phase channel permissions.
- Voting system with kick votes and candidate menus.
- Voice + text channel provisioning with fine-grained permission overwrites.
- Scheduled events, pings, and post-game player relocation.
- Admin controls: punish/unpunish, stop game, force step, table management.

---

## Tech Stack

| Layer            | Technology                       |
| :--------------- | :------------------------------- |
| Runtime          | Node.js                          |
| Discord API      | [`discord.js`](https://discord.js.org/) `^14.25.1` |
| Database         | MongoDB (via `mongodb` `^7.0.0`) |
| Language         | JavaScript (CommonJS)            |

---

## Project Structure

```text
mafia/
├── index.js              # Entry point — boots the client, loads events, logs in
├── config.js             # Local config (token, IDs, permissions, DB URL) — gitignored
├── config_example.js     # Template for config.js
├── serversConfig.json    # Static per-server metadata
├── package.json          # Dependencies and metadata
│
├── clases/               # Base classes
│   ├── Command.js        # Slash command base class
│   └── Interaction.js    # Component / button interaction base class
│
├── commands/             # Slash commands (auto-registered on ready)
│   └── Mafia.js          # /mafia — create, admin, control, etc.
│
├── events/               # Discord gateway event handlers (auto-loaded)
│   ├── ClientReady.js         # Registers commands + interactions on startup
│   ├── GuildMemberAdd.js      # Handles new members
│   ├── MessageCreate.js       # Processes chat messages
│   └── MessageReactionAdd.js  # Reaction-based registration and controls
│
├── interactions/         # Button / select-menu handlers
│   ├── MafiaAction.js         # In-game action buttons
│   ├── MafiaAdmin.js          # Admin panel
│   ├── MafiaLives.js          # Life / death state controls
│   ├── MafiaPings.js          # Player pings
│   ├── MafiaPunish.js         # Punish a player
│   ├── MafiaRegister.js       # Registration flow
│   ├── MafiaRoleAction.js     # Role-specific night actions
│   ├── MafiaStep.js           # Advance game step
│   ├── MafiaStop.js           # Stop / cancel game
│   ├── MafiaTable.js          # Player table UI
│   ├── MafiaTime.js           # Day / night switch
│   ├── MafiaUnpunish.js       # Revoke punishment
│   └── MafiaVote.js           # Voting UI
│
├── services/             # Application services (singleton container)
│   ├── Services.js       # Service locator — initialised at boot
│   ├── Database.js       # Mongo access: events, servers, votes
│   ├── Messages.js       # Message building / sending helpers
│   └── Functions.js      # Shared game logic helpers
│
├── emojies/              # PNG assets for slot icons and role indicators
│   ├── 1.png … 10.png    # Slot numbers
│   ├── don.png, mafia.png, commissar.png, doctor.png, civilian.png
│   ├── host.png, register.png, winner.png, additional.png, empty.png
│
├── Database.md           # MongoDB schema documentation
├── LICENSE               # Portfolio-use license
└── README.md
```

---

## Architecture Overview

```text
                ┌────────────────────────┐
                │       index.js         │
                │  (boots Discord client)│
                └───────────┬────────────┘
                            │
              ┌─────────────┴────────────┐
              │                          │
      ┌───────▼────────┐        ┌────────▼─────────┐
      │  events/*.js   │        │  Services.init() │
      │  (gateway)     │        │  (singleton)     │
      └───────┬────────┘        └────────┬─────────┘
              │                          │
   ┌──────────┴────────┐          ┌──────┴──────┐
   │  ClientReady      │          │  Database   │───► MongoDB
   │  loads:           │          │  Messages   │
   │  • commands/*.js  │          │  Functions  │
   │  • interactions/* │          └─────────────┘
   └───────────────────┘
```

- `index.js` initialises the Discord client and calls `Service.init()`, then dynamically loads every file in `events/` and binds it to its matching gateway event.
- `ClientReady.js` walks `commands/` and `interactions/` on startup, instantiates each class, and registers its handler.
- Every command extends `clases/Command.js`; every button/menu handler extends `clases/Interaction.js`.
- All persistence goes through `services/Database.js`, which exposes typed helpers for the `events`, `servers`, and `votes` collections.

---

## Getting Started

### Prerequisites

- Node.js (LTS)
- MongoDB running locally or reachable via connection string
- A Discord bot token and application

### Installation

```bash
git clone <repo>
cd mafia
npm install
```

### Configuration

1. Copy `config_example.js` to `config.js`.
2. Fill in the bot token, guild/channel/role IDs, emoji IDs, and DB URL.
3. Prepare MongoDB — see [Database.md](./Database.md) for the collection schema and how to seed the `servers` collection.

### Run

```bash
node index.js
```

On startup the bot will:

1. Connect to MongoDB (`[DB] Connected successfuly`).
2. Log in to Discord and print `Bot is online as <tag>`.
3. Register all slash commands and interaction handlers.

---

## Database

The bot uses a single database (`mafia`) with three collections: `events`, `servers`, and `votes`.
See **[Database.md](./Database.md)** for the full schema, field descriptions, and setup notes.

> Only the `servers` collection is created manually — `events` and `votes` are managed by the bot.

---

## Commands

| Command          | Description                        |
| :--------------- | :--------------------------------- |
| `/mafia create`  | Create a new Mafia game            |
| `/mafia admin`   | Admin controls for a running game  |

Modes available on `/mafia create`: `city`, `london`, `newbies`, `web`.

---

## License

Published as a portfolio project. Source is available for learning and review.
Commercial use, resale, or redistribution requires prior written permission — see [LICENSE](./LICENSE).
