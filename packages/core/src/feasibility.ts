export interface Tier {
  minQty: number;
  pricePerUnit: number;
}

export interface ParticipantInput {
  buyerId: string;
  maxTotal: number;
  maxUnitPrice: number;
  quantity: number;
}

export interface TierResolution {
  nextTier: Tier | null;
  shortfall: number | null;
  tier: Tier | null;
}

export type LineItemViolation = "unit_price_exceeds_cap" | "total_exceeds_cap";

export interface LineItemResult {
  allInUnitPrice: number | null;
  buyerId: string;
  quantity: number;
  totalCost: number | null;
  violation: LineItemViolation | null;
  withinCap: boolean;
}

export interface ProposalEvaluation {
  allInUnitPrice: number | null;
  baselineComparisonTotal: number | null;
  combinedQty: number;
  feasible: boolean;
  lineItems: LineItemResult[];
  savings: number | null;
  shortfall: number | null;
  tier: Tier | null;
  totalCost: number | null;
}

/**
 * Highest tier whose threshold the combined quantity has reached, plus the
 * next tier up and how many more units are needed to reach it. Tiers need
 * not be pre-sorted.
 */
export function resolveTier(
  combinedQty: number,
  tiers: readonly Tier[]
): TierResolution {
  const sorted = [...tiers].sort((a, b) => a.minQty - b.minQty);

  let tier: Tier | null = null;
  let nextTier: Tier | null = null;
  for (const candidate of sorted) {
    if (candidate.minQty <= combinedQty) {
      tier = candidate;
    } else {
      nextTier = candidate;
      break;
    }
  }

  const shortfall = nextTier ? nextTier.minQty - combinedQty : null;
  return { nextTier, shortfall, tier };
}

/**
 * Evaluates whether a group purchase is feasible: resolves the applicable
 * supplier tier for the combined quantity, then checks every buyer's
 * all-in unit price and total cost against the ceilings they authorized.
 * A tier being reached does not by itself make the proposal feasible — any
 * buyer whose total would exceed what they authorized blocks it.
 */
export function evaluateProposal(
  requests: readonly ParticipantInput[],
  tiers: readonly Tier[],
  handlingFeePerUnit: number,
  baselineUnitPrice: number | null
): ProposalEvaluation {
  const combinedQty = requests.reduce((sum, r) => sum + r.quantity, 0);
  const { tier, shortfall } = resolveTier(combinedQty, tiers);

  if (!tier) {
    return {
      allInUnitPrice: null,
      baselineComparisonTotal: null,
      combinedQty,
      feasible: false,
      lineItems: requests.map((r) => ({
        allInUnitPrice: null,
        buyerId: r.buyerId,
        quantity: r.quantity,
        totalCost: null,
        violation: null,
        withinCap: true,
      })),
      savings: null,
      shortfall,
      tier: null,
      totalCost: null,
    };
  }

  const allInUnitPrice = tier.pricePerUnit + handlingFeePerUnit;
  const totalCost = combinedQty * allInUnitPrice;

  const lineItems: LineItemResult[] = requests.map((r) => {
    const buyerTotal = r.quantity * allInUnitPrice;
    const exceedsUnitPrice = allInUnitPrice > r.maxUnitPrice;
    const exceedsTotal = buyerTotal > r.maxTotal;
    let violation: LineItemViolation | null = null;
    if (exceedsUnitPrice) {
      violation = "unit_price_exceeds_cap";
    } else if (exceedsTotal) {
      violation = "total_exceeds_cap";
    }

    return {
      allInUnitPrice,
      buyerId: r.buyerId,
      quantity: r.quantity,
      totalCost: buyerTotal,
      violation,
      withinCap: violation === null,
    };
  });

  const feasible = lineItems.every((item) => item.withinCap);
  const baselineComparisonTotal =
    baselineUnitPrice === null ? null : baselineUnitPrice * combinedQty;
  const savings =
    baselineComparisonTotal === null
      ? null
      : baselineComparisonTotal - totalCost;

  return {
    allInUnitPrice,
    baselineComparisonTotal,
    combinedQty,
    feasible,
    lineItems,
    savings,
    shortfall: null,
    tier,
    totalCost,
  };
}

export interface ReconfirmationDiff {
  buyerId: string;
  requiresReconfirmation: boolean;
}

/**
 * Compares two evaluations' line items by buyer and flags which buyers'
 * financial obligation actually changed. A buyer new to the proposal, or
 * one whose all-in unit price or total cost moved, needs to reconfirm
 * before the proposal can be marked ready for organizer review. `prev`
 * being null (the first proposal for a round) means nothing needs
 * reconfirming yet — a buyer's original submitted conditions already are
 * their confirmation of that first version.
 */
export function diffProposals(
  prev: Pick<ProposalEvaluation, "lineItems"> | null,
  next: Pick<ProposalEvaluation, "lineItems">
): ReconfirmationDiff[] {
  if (!prev) {
    return next.lineItems.map((item) => ({
      buyerId: item.buyerId,
      requiresReconfirmation: false,
    }));
  }

  const prevByBuyer = new Map(
    prev.lineItems.map((item) => [item.buyerId, item])
  );

  return next.lineItems.map((item) => {
    const prevItem = prevByBuyer.get(item.buyerId);
    const changed =
      !prevItem ||
      prevItem.allInUnitPrice !== item.allInUnitPrice ||
      prevItem.totalCost !== item.totalCost;
    return { buyerId: item.buyerId, requiresReconfirmation: changed };
  });
}
