# CommonLot

CommonLot is an organizer-controlled purchasing workspace that turns phone-call answers from small buyers and suppliers into an inspectable pooled-order proposal. It uses CALL-E for disclosed conversations, preserves every buyer's private quantity and spending ceiling, and recomputes feasibility whenever an answer changes.

The demo follows three fictional buyers requesting 12, 10, and 8 cartons. Together they reach a supplier's 30-carton price tier. If one buyer drops to 6, CommonLot withdraws the stale result; if another raises their quantity, the proposal stays blocked until their higher spending ceiling is explicitly reconfirmed.

[Open CommonLot](https://commonlot.duckdns.org) · [View the presentation](https://commonlot.duckdns.org/about)

## What it demonstrates

- Structured buyer intake and supplier quote calls through CALL-E.
- A deterministic feasibility engine for quantity tiers, buyer limits, and savings.
- Explicit `SIMULATED`, `LIVE`, and `RECORDED` evidence labels.
- Reconfirmation when a changed proposal exceeds an earlier authorization.
- A separate, human-controlled order timeline: a feasible proposal is never treated as an order.
- A public seven-scene product story at `/about`, including a presentation mode.

## Safety and side effects

Simulation is the default and does not place a phone call or spend CALL-E credits. Live mode shows the target, purpose, and an additional confirmation before dispatch. Use live mode only with consenting recipients and valid E.164 phone numbers.

CommonLot never places an order automatically. Order-status transitions are explicit organizer actions, and the CALL-E API key remains server-side. The included buyers, phone numbers, supplier, prices, and transcripts are fictional demo data.

There are no recurring calls or scheduled jobs to cancel. A queued live call follows CALL-E's own lifecycle; close or cancel it through the CALL-E account if necessary. Stop the local application with `bun run down`.

## Local setup

Requirements: Bun 1.x, PostgreSQL, and optionally a CALL-E API key for live calls.

```bash
bun install
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env
bun run db:push
bun run dev
```

Set these server variables in `apps/server/.env`:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET` with at least 32 characters
- `BETTER_AUTH_URL=http://localhost:3000`
- `CORS_ORIGIN=http://localhost:3001`
- `CALLE_API_KEY` only when live calling is required

Set `NEXT_PUBLIC_SERVER_URL=http://localhost:3000` in `apps/web/.env`. Then open [http://localhost:3001](http://localhost:3001).

## Reproduce the no-call demo

Create an organizer account in the app, then reset the fictional scenario:

```bash
cd packages/db
bun run src/seed.ts organizer@example.com
```

Open the seeded round and keep **Simulation** selected. The complete 12 + 10 + 8 → 28-carton shortfall → reconfirmed 14 + 10 + 6 walkthrough is documented in [DEMO_SCRIPT.md](DEMO_SCRIPT.md).

## Verification

```bash
bun x ultracite check
bun run check-types
bun run test
bun run build
```

## Architecture

- `apps/web`: Next.js 16 and React 19 organizer interface.
- `apps/server`: Elysia and oRPC API.
- `packages/core`: deterministic feasibility rules.
- `packages/calle`: CALL-E client and task templates.
- `packages/db`: Drizzle schema, migrations, and fictional seed.
- `packages/auth`: Better Auth configuration.
- `packages/ui`: shared accessible UI primitives.

## Deployment

The API and web app can run on Railway or Vercel. A self-hosted production stack is also defined in `docker-compose.prod.yml`. `vercel.json` describes the API service, `vercel.web.json` describes the web build, and the app Dockerfiles support container deployment. Keep all credentials in platform-managed environment variables—never commit `.env` files.

## License

This hackathon project is provided as an experimental reference implementation. Review and adapt it before any production or commercial use.
