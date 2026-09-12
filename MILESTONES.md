# CommonLot — Milestone Tracker

Living tracker for the implementation plan in `call-e-commonlot-research.md`. Check items off as they land; keep this file in sync with reality, not with intent.

## M0 — Bootstrap
- [x] `krishna-starter-kit-TS` copied into this repo, fresh git init
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
- [ ] `resolveTier` / `evaluateProposal` / `diffProposals` pure module
- [ ] Unit tests: 30-carton threshold met, C 8→6 shortfall, A 12→14 reconfirmation-required case (doc's exact numbers)

## M3 — oRPC routers
- [ ] Protected CRUD for groups/buyers/suppliers/rounds
- [ ] Round-detail query (latest request/offer/proposal/line-items/calls)

## M4 — CALL-E integration
- [ ] `packages/calle` wrapper over `@call-e/calle`
- [ ] Task templates + `result_schema` per call purpose (buyer_intake, supplier_quote, buyer_reconfirm, supplier_reconfirm)
- [ ] Non-blocking call trigger + dev polling reconciliation
- [ ] Write-back into versioned rows + engine recompute
- [ ] Dry-run mode (no real call spent)

## M5 — Web UI
- [ ] Groups & Suppliers pages
- [ ] New Round wizard
- [ ] Round detail screen: buyer/supplier cards, proposal panel, confirmation tracker, audit log, order-status stepper

## M6 — Demo scenario & harness
- [ ] In-app seed matching the doc's worked example
- [ ] Scripted "C: 8→6, A: 12→14" revision storyline
- [ ] Live/recorded/simulated labeling on the audit log
- [ ] Full dry-run walkthrough without spending real calls

## M7 — Deploy & submission
- [ ] Deploy web + server + managed Postgres
- [ ] Prod env incl. `CALLE_API_KEY`
- [ ] Live URL smoke test
- [ ] <3 min demo video
- [ ] Project description written
- [ ] Contribution PR opened against `awesome-phone-call-agents`

## M8 — Hardening (stretch)
- [ ] Webhook-based call completion
- [ ] India Hindi/Tamil line testing
- [ ] Basic usage metrics (organizer time/proposal, feasible-rate)
