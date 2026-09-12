import { describe, expect, test } from "bun:test";

import {
  diffProposals,
  evaluateProposal,
  type ParticipantInput,
  resolveTier,
  type Tier,
} from "./feasibility";

// Fixtures mirror the worked example in call-e-commonlot-research.md:
// three buyers at 12/10/8 cartons, a ₹950 all-in ceiling each, a supplier
// offer that only kicks in at 30 cartons for ₹900/carton, a ₹50/carton
// handling fee, and a ₹1,200/carton baseline for savings comparison.
const supplierTiers: Tier[] = [{ minQty: 30, pricePerUnit: 900 }];
const handlingFeePerUnit = 50;
const baselineUnitPrice = 1200;

const buyerA: ParticipantInput = {
  buyerId: "A",
  maxTotal: 11_400,
  maxUnitPrice: 950,
  quantity: 12,
};
const buyerB: ParticipantInput = {
  buyerId: "B",
  maxTotal: 9500,
  maxUnitPrice: 950,
  quantity: 10,
};
const buyerC: ParticipantInput = {
  buyerId: "C",
  maxTotal: 7600,
  maxUnitPrice: 950,
  quantity: 8,
};

describe("resolveTier", () => {
  test("returns the highest tier reached and no shortfall once met", () => {
    const result = resolveTier(30, supplierTiers);
    expect(result.tier).toEqual({ minQty: 30, pricePerUnit: 900 });
    expect(result.shortfall).toBeNull();
  });

  test("returns no tier and the exact shortfall below threshold", () => {
    const result = resolveTier(28, supplierTiers);
    expect(result.tier).toBeNull();
    expect(result.nextTier).toEqual({ minQty: 30, pricePerUnit: 900 });
    expect(result.shortfall).toBe(2);
  });
});

describe("evaluateProposal", () => {
  test("30 cartons: feasible, matches the doc's exact figures", () => {
    const result = evaluateProposal(
      [buyerA, buyerB, buyerC],
      supplierTiers,
      handlingFeePerUnit,
      baselineUnitPrice
    );

    expect(result.feasible).toBe(true);
    expect(result.combinedQty).toBe(30);
    expect(result.allInUnitPrice).toBe(950);
    expect(result.totalCost).toBe(28_500);
    expect(result.baselineComparisonTotal).toBe(36_000);
    expect(result.savings).toBe(7500);

    const a = result.lineItems.find((item) => item.buyerId === "A");
    expect(a?.totalCost).toBe(11_400);
    expect(a?.withinCap).toBe(true);
  });

  test("28 cartons (C drops to 6): infeasible with a 2-carton shortfall", () => {
    const result = evaluateProposal(
      [buyerA, buyerB, { ...buyerC, quantity: 6 }],
      supplierTiers,
      handlingFeePerUnit,
      baselineUnitPrice
    );

    expect(result.feasible).toBe(false);
    expect(result.combinedQty).toBe(28);
    expect(result.tier).toBeNull();
    expect(result.shortfall).toBe(2);
    expect(result.totalCost).toBeNull();
    for (const item of result.lineItems) {
      expect(item.allInUnitPrice).toBeNull();
    }
  });

  test("30 cartons (C at 6, A raises to 14, cap unchanged): infeasible on A's cap", () => {
    const result = evaluateProposal(
      [{ ...buyerA, quantity: 14 }, buyerB, { ...buyerC, quantity: 6 }],
      supplierTiers,
      handlingFeePerUnit,
      baselineUnitPrice
    );

    expect(result.combinedQty).toBe(30);
    expect(result.tier).toEqual({ minQty: 30, pricePerUnit: 900 });
    expect(result.feasible).toBe(false);

    const a = result.lineItems.find((item) => item.buyerId === "A");
    expect(a?.totalCost).toBe(13_300);
    expect(a?.withinCap).toBe(false);
    expect(a?.violation).toBe("total_exceeds_cap");

    const b = result.lineItems.find((item) => item.buyerId === "B");
    expect(b?.withinCap).toBe(true);
  });
});

describe("diffProposals", () => {
  const first = evaluateProposal(
    [buyerA, buyerB, buyerC],
    supplierTiers,
    handlingFeePerUnit,
    baselineUnitPrice
  );

  test("nothing requires reconfirmation against a null previous proposal", () => {
    const diff = diffProposals(null, first);
    expect(diff.every((d) => !d.requiresReconfirmation)).toBe(true);
  });

  test("only the buyer whose total changed needs to reconfirm", () => {
    const revised = evaluateProposal(
      [{ ...buyerA, quantity: 14 }, buyerB, { ...buyerC, quantity: 6 }],
      supplierTiers,
      handlingFeePerUnit,
      baselineUnitPrice
    );

    const diff = diffProposals(first, revised);
    const a = diff.find((d) => d.buyerId === "A");
    const b = diff.find((d) => d.buyerId === "B");
    const c = diff.find((d) => d.buyerId === "C");

    // A's and C's quantities (and so totals) changed; B's did not.
    expect(a?.requiresReconfirmation).toBe(true);
    expect(b?.requiresReconfirmation).toBe(false);
    expect(c?.requiresReconfirmation).toBe(true);
  });
});
