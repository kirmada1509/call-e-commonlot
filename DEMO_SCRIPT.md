# CommonLot demo script

Operational runbook for reproducing the exact worked example from
`call-e-commonlot-research.md` end to end in the app, matching the doc's
proposed video shot list (§ "A video narrative within the limit"). Every
number below is the doc's own example — this is not a different scenario,
it's the same one, walked through in the actual UI.

## Before recording: reset to a pristine state

```bash
cd packages/db
bun run src/seed.ts <organizer-email>
```

This wipes any prior "Local Bag Co-op" group / "Metro Packaging Supplies"
supplier for that organizer and recreates them fresh: 3 buyers (Business
A/B/C), 1 supplier, 1 round (baseline ₹1,200/carton, ₹50/carton handling
fee) — with **no requests or supplier offer yet**. The proposal is
assembled live from calls placed through the UI, not pre-filled, so the
demo shows the thing the doc claims: the proposal comes from what was
actually said.

Sign in as the organizer, go to `/rounds`, open the seeded round.

## Real vs. dry-run calls

Every call-trigger form on the round page defaults to **dry run** (no
CALLE_API_KEY spent) with inputs to type in the "answer" as if it had come
from a real call. Uncheck "Dry run" to place an actual CALL-E call — the
buyer/supplier phone numbers in the seed are placeholders; replace them
with consenting real numbers in `/setup` first if recording real calls.

**Known constraint (found during M4):** this account's India (+91) line
is currently restricted — real calls to +91 numbers return `NO ANSWER`
without ringing. CALL-E's maintainer confirmed this on Discord and
provided an official US testing hotline (`+1 276-322-9632`) that does
connect and hold a real conversation, but it's a generic assistant, not a
buyer — it won't give purchase answers. For narration-quality real-call
footage, get 1–3 consenting real phone numbers (any region CALL-E
currently supports for this account) and swap them into the buyer/
supplier phone fields before recording. Otherwise, dry-run mode is fully
legitimate for the demo: the audit log tags every call SIMULATED
explicitly, and the doc requires exactly this kind of honest labeling.

## Shot-by-shot

### 0:00–0:20 — the problem

Show the round page before any calls: three buyer cards ("Not
contacted"), the supplier card ("No supplier offer yet"), and the
proposal panel ("No proposal yet"). Narrate the setup: three businesses,
one supplier, an unknown-yet threshold.

### 0:20–0:55 — collect answers

Place 4 calls (buyer_intake ×3, supplier_quote ×1). Dry-run values below
reproduce the doc's numbers exactly:

| Target | Purpose | Quantity | Max ₹/unit | Max total | Notes |
|---|---|---|---|---|---|
| Business A | Intake | 12 | 950 | 11400 | |
| Business B | Intake | 10 | 950 | 9500 | |
| Business C | Intake | 8 | 950 | 7600 | |
| Metro Packaging Supplies | Quote | tier: minQty 30, price 900 | — | — | Collection window / conditions optional |

After all 4, each buyer card shows "Collected" and the supplier card
shows its tier.

### 0:55–1:20 — the proposal emerges

The proposal panel should now read:
- **Ready for organizer review**
- Combined quantity: **30**
- All-in price: **₹950**/carton (tier reached at 30)
- Total cost: **₹28,500**
- Estimated savings vs. baseline: **₹7,500**

This is the doc's exact table (§ "A concrete example"). Point out this
number only exists because all three buyers' answers combined crossed the
supplier's 30-carton threshold — no individual buyer could get here alone.

### 1:20–1:45 — C changes their mind

Place another Business C call (Reconfirm, or Intake again — both write
back the same way): quantity **6**, same ₹950/₹5,700 ceiling.

Proposal panel should flip to:
- **Not feasible**
- "Needs 2 more units to reach the next supplier tier."

This is the doc's "must withdraw the earlier feasibility result and
identify the two-carton shortfall" moment.

### 1:45–2:25 — A raises their quantity, then reconfirms

First call: Business A, quantity **14**, ceiling **unchanged** (₹950 /
₹11,400 — do not raise the total yet).

Proposal panel: combined quantity back to 30, but still **not feasible** —
Business A's card shows "exceeds this buyer's cap" (₹13,020+ > ₹11,400).
This is the doc's "its earlier ₹11,400 authorization cannot cover the
change" moment — the system does not silently approve the larger total.

Second call: Business A again, quantity **14**, ceiling raised to
**₹13,300** (their explicit new authorization).

Proposal panel flips back to **Ready for organizer review** — same
₹28,500 total, ₹950/carton, ₹7,500 savings as the original proposal,
now reflecting A=14/B=10/C=6=30.

### 2:25–2:50 — review and audit

Scroll the activity log on each buyer/supplier card: every entry is
tagged **SIMULATED** (or **LIVE**/**RECORDED** for any real calls placed).
Expand a transcript if a real call was used. Show the order-status
stepper as a separate, manual, organizer-only ledger — advancing it
("Proposal ready" → "Organizer approved" → ...) does not change the
proposal's feasibility status, demonstrating the doc's boundary between
"a feasible proposal" and "an actual purchase."

## What this proves

Every number on screen is traceable to a specific call result, the
combined-quantity threshold behavior is real (not hardcoded), and a
buyer's own recorded ceiling — not just their latest quantity — gates
whether a proposal can be marked ready. The revision after C's and A's
changes is the product's "strongest moment" per the doc, and it's driven
by the same `packages/core` feasibility engine unit-tested in M2, not by
anything scripted for the video.
