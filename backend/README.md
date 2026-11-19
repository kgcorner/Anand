# Anand Backend

TypeScript / Node.js (Express 5) REST API for Anand (HealthPulse). This is the initial scaffold only.

## Requirements

- Node.js 20, 22, 23, 24, 25, or 26 (as supported by `better-sqlite3` 12.x; developed on Node 24)
- npm; native build tools may be needed if a prebuilt SQLite binding is unavailable

## Setup

```bash
npm install
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Run with `tsx` in watch mode (no build step) |
| `npm run typecheck` | Type-check the project without emitting files |
| `npm test` | Build and run the SQLite and server lifecycle tests |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server (`node dist/server.js`) |
| `npm run clean` | Remove `dist/` |

## Configuration

Set these environment variables in your shell or deployment environment (see `.env.example`). The server does not automatically load `.env`:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8080` | HTTP port |
| `HOST` | `0.0.0.0` | Bind address |
| `DATABASE_PATH` | `./data/anand.sqlite` | SQLite file; relative to the process working directory. Use `:memory:` for a temporary database. |

## SQLite

The server opens the SQLite database, runs pending schema migrations before listening, and closes the connection on shutdown. The parent directory is created when necessary; keep it writable and persist it outside the container when deploying. Foreign keys are enabled and file-backed databases use WAL mode.

Each owning module defines its persistence model in `<module>.model.ts` and its async repository contract in `<module>.repository.ts`. Those files do not import a database driver. SQLite implementations and versioned SQL live in each module's `sqlite/` folder. Future services should receive their own repository contract, not a raw connection or another domain's repository. No clinical routes or services are wired to the repositories yet.

Schema v1 creates `users`, `patients`, `vitals`, `medical_visits`, `medications`, `documents`, and `lab_results`. SQLite stores nested profile data, visit document IDs, extraction drafts and lab reference ranges as JSON while the contracts expose typed objects and arrays. Reference data remains file-backed, LLM settings remain configuration, and read models have no tables. To change a deployed schema, add a new migration in the owning module and register it in `src/platform/sqlite/migrations.ts`; leave earlier migrations unchanged.

SQLite files, including WAL and shared-memory files, can contain sensitive data and are not encrypted by this setup. Restrict access to the database directory and use encrypted storage. The default data directory and `.sqlite` files are gitignored; custom paths and other file extensions must also be protected. A memory database is lost when the process exits.

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/health` | Liveness check |

Unknown routes return a JSON `404` response.

## Project layout

```
src/
├── server.ts            # Process entry point (listen + graceful shutdown)
├── app.ts               # Express app factory (middleware, routers, error handling)
├── platform/
│   └── database.ts      # SQLite connection
├── modules/             # Domain scaffolding
└── routes/
    ├── index.ts         # Mounts all routers under /api/v1
    └── health.routes.ts # Health check
```
