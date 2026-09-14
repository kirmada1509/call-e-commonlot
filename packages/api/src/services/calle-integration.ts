import type { Call, CalleClient, JsonObject } from "@call-e-commonlot/calle";
import {
  type BuyerCallPurpose,
  buildBuyerTaskTemplate,
  buildSupplierTaskTemplate,
  type CallPurpose,
  type SupplierCallPurpose,
} from "@call-e-commonlot/calle";
import type { Database } from "@call-e-commonlot/db";
import {
  buyer,
  call,
  proposal,
  purchaseRound,
  supplier,
} from "@call-e-commonlot/db/schema/commonlot";
import { and, desc, eq, inArray } from "drizzle-orm";

import {
  submitParticipantRequest,
  submitSupplierOffer,
} from "./proposal-engine";

type CallStatus =
  | "queued"
  | "in_progress"
  | "completed"
  | "failed"
  | "canceled";
type CallRow = typeof call.$inferSelect;

export interface TriggerBuyerCallInput {
  buyerId: string;
  dryRun: boolean;
  purpose: BuyerCallPurpose;
  roundId: string;
  simulatedResult?: JsonObject;
}

export interface TriggerSupplierCallInput {
  dryRun: boolean;
  purpose: SupplierCallPurpose;
  roundId: string;
  simulatedResult?: JsonObject;
}

function mapCalleStatus(status: Call["status"]): CallStatus {
  switch (status) {
    case "queued":
    case "in_progress":
    case "completed":
    case "failed":
    case "canceled":
      return status;
    default:
      return "in_progress";
  }
}

async function getActiveProposal(db: Database, roundId: string) {
  return await db.query.proposal.findFirst({
    orderBy: desc(proposal.version),
    where: eq(proposal.roundId, roundId),
    with: { lineItems: true },
  });
}

export async function triggerBuyerCall(
  db: Database,
  calle: CalleClient | null,
  input: TriggerBuyerCallInput
): Promise<CallRow> {
  const round = await db.query.purchaseRound.findFirst({
    where: eq(purchaseRound.id, input.roundId),
  });
  if (!round) {
    throw new Error(`Round ${input.roundId} not found`);
  }
  const target = await db.query.buyer.findFirst({
    where: eq(buyer.id, input.buyerId),
  });
  if (!target) {
    throw new Error(`Buyer ${input.buyerId} not found`);
  }

  const activeProposal =
    input.purpose === "buyer_reconfirm"
      ? await getActiveProposal(db, input.roundId)
      : null;
  const lineItem = activeProposal?.lineItems.find(
    (item) => item.buyerId === input.buyerId
  );

  const { task, resultSchema } = buildBuyerTaskTemplate(input.purpose, {
    businessName: target.businessName,
    contactName: target.contactName,
    productName: round.productName,
    revisedAllInUnitPrice: lineItem
      ? Number(lineItem.allInUnitPrice)
      : undefined,
    revisedQuantity: lineItem?.quantity,
    revisedTotal: lineItem ? Number(lineItem.totalCost) : undefined,
    unitLabel: round.unitLabel,
  });

  return await createAndDispatchCall(db, calle, {
    dryRun: input.dryRun,
    phone: target.phone,
    purpose: input.purpose,
    resultSchema,
    roundId: input.roundId,
    simulatedResult: input.simulatedResult,
    targetId: input.buyerId,
    targetType: "buyer",
    task,
  });
}

export async function triggerSupplierCall(
  db: Database,
  calle: CalleClient | null,
  input: TriggerSupplierCallInput
): Promise<CallRow> {
  const round = await db.query.purchaseRound.findFirst({
    where: eq(purchaseRound.id, input.roundId),
  });
  if (!round) {
    throw new Error(`Round ${input.roundId} not found`);
  }
  const target = await db.query.supplier.findFirst({
    where: eq(supplier.id, round.supplierId),
  });
  if (!target) {
    throw new Error(`Supplier ${round.supplierId} not found`);
  }

  const activeProposal = await getActiveProposal(db, input.roundId);

  const { task, resultSchema } = buildSupplierTaskTemplate(input.purpose, {
    combinedQtySoFar: activeProposal?.combinedQty,
    productName: round.productName,
    supplierName: target.name,
    unitLabel: round.unitLabel,
  });

  return await createAndDispatchCall(db, calle, {
    dryRun: input.dryRun,
    phone: target.phone,
    purpose: input.purpose,
    resultSchema,
    roundId: input.roundId,
    simulatedResult: input.simulatedResult,
    targetId: round.supplierId,
    targetType: "supplier",
    task,
  });
}

interface CreateAndDispatchInput {
  dryRun: boolean;
  phone: string;
  purpose: CallPurpose;
  resultSchema: Record<string, unknown>;
  roundId: string;
  simulatedResult?: JsonObject;
  targetId: string;
  targetType: "buyer" | "supplier";
  task: string;
}

async function createAndDispatchCall(
  db: Database,
  calle: CalleClient | null,
  input: CreateAndDispatchInput
): Promise<CallRow> {
  if (!(input.dryRun || calle)) {
    throw new Error(
      "CALL-E is not configured (missing CALLE_API_KEY) — use dryRun instead"
    );
  }

  const [row] = await db
    .insert(call)
    .values({
      mode: input.dryRun ? "simulated" : "real",
      purpose: input.purpose,
      resultSchema: input.resultSchema,
      roundId: input.roundId,
      status: input.dryRun ? "completed" : "queued",
      structuredResult: input.dryRun ? (input.simulatedResult ?? null) : null,
      targetId: input.targetId,
      targetType: input.targetType,
      task: input.task,
    })
    .returning();
  if (!row) {
    throw new Error("Failed to insert call record");
  }

  if (input.dryRun) {
    await applyCallResult(db, row);
    return row;
  }

  // biome-ignore lint/style/noNonNullAssertion: guarded above — dryRun is false, so calle is non-null
  const created = await calle!.calls.create({
    recipient: { phones: [input.phone] },
    resultSchema: input.resultSchema,
    task: input.task,
  });

  const [updated] = await db
    .update(call)
    .set({ calleCallId: created.id, status: mapCalleStatus(created.status) })
    .where(eq(call.id, row.id))
    .returning();
  return updated ?? row;
}

/**
 * Polls CALL-E for any of this round's real calls still in flight, updates
 * their status/transcript/structured result, and writes completed results
 * back into the round (which recomputes the proposal). Safe to call on
 * every round-detail fetch — a no-op when there's nothing pending or no
 * CALL-E client configured.
 */
export async function reconcilePendingCalls(
  db: Database,
  calle: CalleClient | null,
  roundId: string
): Promise<void> {
  if (!calle) {
    return;
  }

  const pending = await db.query.call.findMany({
    where: and(
      eq(call.roundId, roundId),
      eq(call.mode, "real"),
      inArray(call.status, ["queued", "in_progress"])
    ),
  });

  for (const row of pending) {
    if (!row.calleCallId) {
      continue;
    }
    // Sequential on purpose: applyCallResult -> recomputeProposal reads the
    // round's latest proposal version and inserts the next one. Running
    // these concurrently for the same round would race on that version.
    // biome-ignore lint/performance/noAwaitInLoops: see above
    const remote = await calle.calls.get(row.calleCallId);
    const status = mapCalleStatus(remote.status);
    const transcript = remote.recipients.flatMap((recipient) =>
      recipient.attempts.flatMap((attempt) => attempt.transcriptTurns)
    );

    const [updated] = await db
      .update(call)
      .set({
        errorMessage: remote.failureMessage,
        status,
        structuredResult: remote.structuredResult,
        transcript,
      })
      .where(eq(call.id, row.id))
      .returning();

    if (status === "completed" && updated) {
      await applyCallResult(db, updated);
    }
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * CALL-E's result_schema can't express "number or the literal 'unknown'"
 * directly (no oneOf/const support), so numeric answers come back as
 * strings. Parses a numeral string, returning null for "unknown", empty,
 * or anything unparseable rather than guessing.
 */
function parseNumeralAnswer(value: unknown): number | null {
  if (isFiniteNumber(value)) {
    return value;
  }
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.toLowerCase() === "unknown") {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

async function applyCallResult(db: Database, row: CallRow): Promise<void> {
  const result = row.structuredResult as JsonObject | null;
  if (!result) {
    return;
  }

  if (row.purpose === "buyer_intake" || row.purpose === "buyer_reconfirm") {
    const quantity = parseNumeralAnswer(result.quantity);
    const maxUnitPrice = parseNumeralAnswer(result.maxUnitPrice);
    const maxTotal = parseNumeralAnswer(result.maxTotal);
    if (quantity === null || maxUnitPrice === null || maxTotal === null) {
      // At least one answer came back "unknown" — do not count as demand.
      return;
    }
    await submitParticipantRequest(db, {
      buyerId: row.targetId,
      maxTotal,
      maxUnitPrice,
      quantity,
      roundId: row.roundId,
      source: "call",
      sourceCallId: row.id,
    });
    return;
  }

  const tiersInput = result.tiers;
  if (!Array.isArray(tiersInput)) {
    return;
  }
  const tiers = tiersInput.filter(
    (t): t is { minQty: number; pricePerUnit: number } =>
      typeof t === "object" &&
      t !== null &&
      isFiniteNumber((t as JsonObject).minQty) &&
      isFiniteNumber((t as JsonObject).pricePerUnit)
  );
  if (tiers.length === 0) {
    return;
  }

  await submitSupplierOffer(db, {
    collectionWindow: nonEmptyString(result.collectionWindow),
    conditions: nonEmptyString(result.conditions),
    roundId: row.roundId,
    source: "call",
    sourceCallId: row.id,
    tiers,
  });
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
}
