import {
  diffProposals,
  evaluateProposal,
  type ParticipantInput,
  type Tier,
} from "@call-e-commonlot/core";
import type { Database } from "@call-e-commonlot/db";
import {
  participantRequest,
  proposal,
  proposalLineItem,
  purchaseRound,
  supplierOffer,
} from "@call-e-commonlot/db/schema/commonlot";
import { and, desc, eq, isNull } from "drizzle-orm";

export type RequestSource = "call" | "manual";

export interface SubmitParticipantRequestInput {
  buyerId: string;
  maxTotal: number;
  maxUnitPrice: number;
  quantity: number;
  roundId: string;
  source: RequestSource;
  sourceCallId?: string;
}

export interface SubmitSupplierOfferInput {
  collectionWindow?: string;
  conditions?: string;
  roundId: string;
  source: RequestSource;
  sourceCallId?: string;
  tiers: Tier[];
}

async function supersedeAndInsertRequest(
  db: Database,
  input: SubmitParticipantRequestInput
) {
  const previous = await db.query.participantRequest.findFirst({
    where: and(
      eq(participantRequest.roundId, input.roundId),
      eq(participantRequest.buyerId, input.buyerId),
      isNull(participantRequest.supersededAt)
    ),
  });

  if (previous) {
    await db
      .update(participantRequest)
      .set({ supersededAt: new Date() })
      .where(eq(participantRequest.id, previous.id));
  }

  await db.insert(participantRequest).values({
    buyerId: input.buyerId,
    maxTotal: input.maxTotal.toString(),
    maxUnitPrice: input.maxUnitPrice.toString(),
    quantity: input.quantity,
    roundId: input.roundId,
    source: input.source,
    sourceCallId: input.sourceCallId ?? null,
    version: (previous?.version ?? 0) + 1,
  });
}

async function supersedeAndInsertOffer(
  db: Database,
  input: SubmitSupplierOfferInput
) {
  const previous = await db.query.supplierOffer.findFirst({
    orderBy: desc(supplierOffer.createdAt),
    where: and(
      eq(supplierOffer.roundId, input.roundId),
      isNull(supplierOffer.supersededAt)
    ),
  });

  if (previous) {
    await db
      .update(supplierOffer)
      .set({ supersededAt: new Date() })
      .where(eq(supplierOffer.id, previous.id));
  }

  await db.insert(supplierOffer).values({
    collectionWindow: input.collectionWindow ?? null,
    conditions: input.conditions ?? null,
    roundId: input.roundId,
    source: input.source,
    sourceCallId: input.sourceCallId ?? null,
    tiers: input.tiers,
    version: (previous?.version ?? 0) + 1,
  });
}

/**
 * Recomputes the round's proposal from its currently active (non-superseded)
 * participant requests and supplier offer. Returns null when there isn't
 * yet enough information to propose anything (no requests, or no supplier
 * offer collected). Every call inserts a new proposal version rather than
 * mutating the previous one, so "why did this stop being feasible" stays
 * answerable from history.
 */
export async function recomputeProposal(db: Database, roundId: string) {
  const round = await db.query.purchaseRound.findFirst({
    where: eq(purchaseRound.id, roundId),
  });
  if (!round) {
    throw new Error(`Round ${roundId} not found`);
  }

  const activeRequests = await db.query.participantRequest.findMany({
    where: and(
      eq(participantRequest.roundId, roundId),
      isNull(participantRequest.supersededAt)
    ),
  });
  const activeOffer = await db.query.supplierOffer.findFirst({
    orderBy: desc(supplierOffer.createdAt),
    where: and(
      eq(supplierOffer.roundId, roundId),
      isNull(supplierOffer.supersededAt)
    ),
  });

  if (activeRequests.length === 0 || !activeOffer) {
    return null;
  }

  const inputs: ParticipantInput[] = activeRequests.map((r) => ({
    buyerId: r.buyerId,
    maxTotal: Number(r.maxTotal),
    maxUnitPrice: Number(r.maxUnitPrice),
    quantity: r.quantity,
  }));

  const evaluation = evaluateProposal(
    inputs,
    activeOffer.tiers,
    Number(round.handlingFeePerUnit),
    round.baselineUnitPrice ? Number(round.baselineUnitPrice) : null
  );

  const previousProposal = await db.query.proposal.findFirst({
    orderBy: desc(proposal.version),
    where: eq(proposal.roundId, roundId),
    with: { lineItems: true },
  });

  // Diff against the last *feasible* proposal, not just the immediately
  // prior version: an infeasible proposal stores null pricing on every line
  // item, and diffing against nulls would flag every buyer for
  // reconfirmation (not just the one whose actual terms changed) the moment
  // the round becomes feasible again.
  const previousFeasibleProposal = previousProposal?.feasible
    ? previousProposal
    : await db.query.proposal.findFirst({
        orderBy: desc(proposal.version),
        where: and(eq(proposal.roundId, roundId), eq(proposal.feasible, true)),
        with: { lineItems: true },
      });

  const previousLineItems = previousFeasibleProposal
    ? {
        lineItems: previousFeasibleProposal.lineItems.map((li) => ({
          allInUnitPrice: Number(li.allInUnitPrice),
          buyerId: li.buyerId,
          quantity: li.quantity,
          totalCost: Number(li.totalCost),
          violation: null,
          withinCap: li.withinCap,
        })),
      }
    : null;

  const diffs = diffProposals(previousLineItems, evaluation);
  const requiresReconfirmationByBuyer = new Map(
    diffs.map((d) => [d.buyerId, d.requiresReconfirmation])
  );
  const anyRequiresReconfirmation = diffs.some((d) => d.requiresReconfirmation);

  let status: "infeasible" | "feasible_unconfirmed" | "ready_for_review" =
    "infeasible";
  if (evaluation.feasible) {
    status = anyRequiresReconfirmation
      ? "feasible_unconfirmed"
      : "ready_for_review";
  }

  const [insertedProposal] = await db
    .insert(proposal)
    .values({
      allInUnitPrice: evaluation.allInUnitPrice?.toString() ?? null,
      baselineComparisonTotal:
        evaluation.baselineComparisonTotal?.toString() ?? null,
      combinedQty: evaluation.combinedQty,
      feasible: evaluation.feasible,
      roundId,
      savings: evaluation.savings?.toString() ?? null,
      shortfall: evaluation.shortfall,
      status,
      tierMinQty: evaluation.tier?.minQty ?? null,
      totalCost: evaluation.totalCost?.toString() ?? null,
      unitPrice: evaluation.tier?.pricePerUnit.toString() ?? null,
      version: (previousProposal?.version ?? 0) + 1,
    })
    .returning();

  if (!insertedProposal) {
    throw new Error("Failed to insert proposal");
  }

  if (evaluation.tier) {
    const requestByBuyer = new Map(activeRequests.map((r) => [r.buyerId, r]));

    await db.insert(proposalLineItem).values(
      evaluation.lineItems.map((item) => {
        const request = requestByBuyer.get(item.buyerId);
        if (!request) {
          throw new Error(`No active request found for buyer ${item.buyerId}`);
        }
        const requiresReconfirmation =
          requiresReconfirmationByBuyer.get(item.buyerId) ?? false;

        // Only reachable when tier is set, so these are always numbers.
        const allInUnitPrice = item.allInUnitPrice as number;
        const totalCost = item.totalCost as number;

        return {
          allInUnitPrice: allInUnitPrice.toString(),
          buyerId: item.buyerId,
          confirmed: !requiresReconfirmation,
          confirmedAt: requiresReconfirmation ? null : new Date(),
          participantRequestId: request.id,
          proposalId: insertedProposal.id,
          quantity: item.quantity,
          requiresReconfirmation,
          totalCost: totalCost.toString(),
          withinCap: item.withinCap,
        };
      })
    );
  }

  return insertedProposal;
}

export async function submitParticipantRequest(
  db: Database,
  input: SubmitParticipantRequestInput
) {
  await supersedeAndInsertRequest(db, input);
  return recomputeProposal(db, input.roundId);
}

export async function submitSupplierOffer(
  db: Database,
  input: SubmitSupplierOfferInput
) {
  await supersedeAndInsertOffer(db, input);
  return recomputeProposal(db, input.roundId);
}

/**
 * Re-derives a proposal's status from its line items' confirmation state
 * without recomputing the underlying feasibility numbers. Used after a
 * buyer confirms a line item that had `requiresReconfirmation` set.
 */
export async function refreshProposalStatus(db: Database, proposalId: string) {
  const current = await db.query.proposal.findFirst({
    where: eq(proposal.id, proposalId),
  });
  if (!current?.feasible) {
    return current ?? null;
  }

  const items = await db.query.proposalLineItem.findMany({
    where: eq(proposalLineItem.proposalId, proposalId),
  });
  const allConfirmed = items.every((item) => item.confirmed);
  const nextStatus = allConfirmed ? "ready_for_review" : "feasible_unconfirmed";

  if (nextStatus === current.status) {
    return current;
  }

  const [updated] = await db
    .update(proposal)
    .set({ status: nextStatus })
    .where(eq(proposal.id, proposalId))
    .returning();
  return updated ?? current;
}

export async function confirmProposalLineItem(
  db: Database,
  lineItemId: string,
  confirmedByCallId?: string
) {
  const [updated] = await db
    .update(proposalLineItem)
    .set({
      confirmed: true,
      confirmedAt: new Date(),
      confirmedByCallId: confirmedByCallId ?? null,
    })
    .where(eq(proposalLineItem.id, lineItemId))
    .returning();

  if (updated) {
    await refreshProposalStatus(db, updated.proposalId);
  }
  return updated ?? null;
}
