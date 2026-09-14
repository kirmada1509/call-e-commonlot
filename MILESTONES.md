# CommonLot — Milestone Tracker

Living tracker for the implementation plan in `call-e-commonlot-research.md`. Check items off as they land; keep this file in sync with reality, not with intent.

## M0 — Bootstrap
- [x] `call-e-commonlot-TS` copied into this repo, fresh git init
- [x] `bun install`
- [x] Postgres available locally (Homebrew `postgresql@18`, port 5432 — Docker Desktop wasn't running; see note below) and `db:push` applied
- [x] `apps/server/.env` / `apps/web/.env` set (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CORS_ORIGIN`, `NEXT_PUBLIC_SERVER_URL`)
- [x] `bun run dev` verified: server on :3000, web on :3001, `/rpc/healthCheck` returns `OK`
- [x] Stock sign-up/sign-in verified in-browser (dashboard loads, protected `privateData` RPC call succeeds)
- [x] `MILESTONES.md` added
- [x] First commit

> Note: `bun run up`/`status`/`down` assume Docker for Postgres and will try to start a container even though a local Postgres is already running on 5432. Either start Docker Desktop before using those scripts, or keep using `bun run dev` directly (what M0 verified) with the local Postgres service (`brew services start postgresql@18`).

## M1 — Domain schema
- [x] Drizzle tables: `group`, `buyer`, `supplier`, `purchaseRound`, `participantRequest`, `supplierOffer`, `proposal`, `proposalLineItem`, `call`, `orderStatusEvent`
- [x] `db:push` applied (verified via `psql \dt`, 10 `commonlot_*` tables)
- [x] Seed script for the doc's 3-buyer/1-supplier bag-carton scenario (`bun run db:seed` in `packages/db`, requires an already-registered organizer email as arg)

## M2 — Feasibility engine
- [x] `resolveTier` / `evaluateProposal` / `diffProposals` pure module (`packages/core`)
- [x] Unit tests: 30-carton threshold met, C 8→6 shortfall, A 12→14 reconfirmation-required case (doc's exact numbers) — 7/7 passing via `bun run test`

## M3 — oRPC routers
- [x] Protected CRUD for groups/buyers/suppliers/rounds (create/list + addBuyer; update/delete deferred — not needed for the demo path)
- [x] Round-detail query (latest request/offer/proposal/line-items/calls/order-status events)
- [x] Proposal engine wiring (`submitParticipantRequest`/`submitSupplierOffer` version-and-recompute, `confirmLineItem`, `recordOrderStatus`) — verified live against the running dev server: reproduced the doc's exact 30-carton feasible case, C's 8→6 shortfall, A's 12→14 cap violation, A's reconfirmation resolving it, a supplier price revision putting all three buyers into `feasible_unconfirmed`, and per-buyer confirmation flipping the round to `ready_for_review`

## M4 — CALL-E integration
- [x] `packages/calle` wrapper over `@call-e/calle` (5 unit tests on task-template builders)
- [x] Task templates + `result_schema` per call purpose (buyer_intake, supplier_quote, buyer_reconfirm, supplier_reconfirm) — numeric answers are strings with an explicit `"unknown"` sentinel, since CALL-E's `result_schema` rejects `oneOf`/`const` (discovered via a live 400 from the real API, not from docs)
- [x] Non-blocking call trigger (`packages/api/src/services/calle-integration.ts`) + reconciliation on every `rounds.get` fetch (polls CALL-E for any of the round's non-terminal real calls)
- [x] Write-back into versioned rows + engine recompute — verified live: an "unknown" answer correctly produces **no** write-back (doc's "silence is not treated as demand" requirement), a usable answer flows straight into `submitParticipantRequest`/`submitSupplierOffer` and recomputes the proposal
- [x] Dry-run mode (`dryRun: true` + `simulatedResult` on the trigger mutations; no CALLE_API_KEY or call spent) — verified live for both buyer and supplier calls
- [x] **Real CALL-E calls placed and verified**: first attempt to a consenting `+91` number failed with `NO ANSWER` — traced via `/v1/calls/{id}/events` to India lines being restricted on this account (confirmed by CALL-E maintainer on Discord, who provided an official US testing hotline `+1 276-322-9632`); a second real call to that hotline connected, ran a full 17-turn conversation, and correctly recorded all three fields as `"unknown"` when the line couldn't actually place an order — exactly the "missing answer ≠ demand" behavior the design requires

## M5 — Web UI
- [x] Groups & Suppliers pages (`/setup`) — create group, add buyers, create supplier
- [x] New Round wizard (`/rounds`) — create round + list existing rounds
- [x] Round detail screen (`/rounds/[roundId]`): buyer/supplier cards with inline call-trigger forms (dry-run by default, real-call opt-in), proposal panel with feasibility badge/shortfall/savings, confirmation tracker with per-buyer "Confirm new total", activity log tagged LIVE/SIMULATED with expandable transcripts, manual order-status stepper — verified end-to-end in-browser: placed a dry-run call through the actual form (not raw RPC), watched the proposal recompute live, confirmed all three reconfirmation-required line items through the UI and watched status flip to `ready_for_review`

## M6 — Demo scenario & harness
- [x] In-app seed matching the doc's worked example, made resettable (`bun run src/seed.ts <email>` in `packages/db` now wipes any prior demo group/supplier for that organizer first — safe to re-run before recording) and changed to seed only entities, not pre-filled requests/offer, so the proposal is genuinely assembled from calls placed through the app rather than starting pre-computed
- [x] Scripted "C: 8→6, A: 12→14" revision storyline — written up shot-by-shot in [DEMO_SCRIPT.md](DEMO_SCRIPT.md), matched to the research doc's video shot list
- [x] Live/recorded/simulated labeling on the audit log — the call-activity badge now distinguishes LIVE (real call still in flight), RECORDED (real call, terminal state — a genuine past event being reviewed), and SIMULATED (dry-run), not just real-vs-simulated
- [x] Full dry-run walkthrough verified end-to-end against a freshly reset seed, live in the browser, through the actual oRPC calls the UI forms submit: pristine state → 3 buyer intakes + 1 supplier quote → ready_for_review at ₹28,500/₹7,500 savings (doc's exact figures) → C drops to 6 → infeasible/shortfall 2 (doc's exact figure) → A raises to 14 at an unchanged cap → infeasible on A's cap → A reconfirms with a raised cap → ready_for_review again at the same ₹28,500/₹7,500 — reset back to pristine afterward

## M7 — Deploy & submission
- [x] GitHub repo created and pushed: https://github.com/kirmada1509/call-e-commonlot (public, `kirmadas-projects-dee4bf38` Vercel scope, connected for git-triggered deploys)
- [x] Managed Postgres provisioned on Railway (project `call-e-commonlot`, service `postgres`, public TCP proxy at `altaria.proxy.rlwy.net:22117`) — schema pushed, all 14 tables (`commonlot_*` + better-auth) confirmed present
- [x] Real bugs found and fixed along the way (all committed to `main`):
  - `.vercelignore` was excluding `.env.schema` (needed at build time; carries no secrets)
  - The starter kit's unused Mastra AI-chat feature (`apps/server/src/mastra/`, `/ai` web page) crashed the server at import time on a bad Postgres config — removed entirely, along with its now-unused deps (`@mastra/*`, `@ai-sdk/*`, `ai`, `@sinclair/typebox`, `streamdown`) and `GOOGLE_GENERATIVE_AI_API_KEY`
  - `.vercelignore` had no exclusions for `.next`/`dist`/`.turbo`/`node_modules`, so a local `vercel deploy` once tried to upload a stray 500MB `.next` build artifact and hit Vercel's upload limit
  - Root-caused (via `vercel build`'s own output directory, not guesswork) that Vercel's file-tracer never includes `apps/server/.env.schema` in the deployed function since it's read via a dynamic fs call, not a static import — fixed using varlock's own documented mechanism for this: a build-time-resolved `__VARLOCK_ENV` blob + `_VARLOCK_USE_INJECTED_ENV=1` project env var, **verified working end-to-end locally** (real request/response cycle, zero `.env`/`.env.schema` files present, simulating the exact stripped-down Vercel runtime condition)
  - Learned the hard way that `vercel.json`'s `"services"` block is Vercel's own single-project multi-service mechanism, not a way to run one service per separate Vercel project — reverted an accidental two-project split back to one `call-e-commonlot-server` project
- [ ] **Blocked**: the deployed server function crashes on every request with a bare `ResolveMessage {}` (Bun's own module-resolution error class, no further detail even via `vercel logs --json`) — reproduced with both `src/index.ts` (Vercel's own bundler) and our own built `apps/server/dist/index.mjs` as the entrypoint. The `dist/index.mjs` case is the more suspicious one: it's committed to git for Vercel's pre-build entrypoint-existence check (see `.gitignore`/`.vercelignore` exceptions), and is the *exact* build verified working locally under a simulated Vercel runtime — something in Vercel's actual packaging of it still differs in a way local reproduction hasn't caught. Handed off to the user to continue in the Vercel dashboard, where fuller error output may be visible than the CLI surfaces.
- [ ] Prod env incl. `CALLE_API_KEY` (already set on the Vercel project, along with `DATABASE_URL`/`BETTER_AUTH_SECRET`/the `__VARLOCK_ENV` blob — see above)
- [ ] Live URL smoke test
- [x] Self-hosted production stack live at https://commonlot.duckdns.org with HTTPS, isolated Postgres/API/web containers, and the public `/about` presentation
- [ ] `web` Vercel project (not yet created — blocked behind getting `server` stable first)
- [ ] <3 min demo video
- [ ] Project description written
- [ ] Contribution PR opened against `awesome-phone-call-agents`

## M8 — Hardening (stretch)
- [ ] Webhook-based call completion
- [ ] India Hindi/Tamil line testing
- [ ] Basic usage metrics (organizer time/proposal, feasible-rate)
