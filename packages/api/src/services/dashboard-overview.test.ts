import { describe, expect, it } from "bun:test";

import { buildDashboardOverview } from "./dashboard-overview";

const now = new Date("2026-09-13T10:00:00.000Z");
const earlier = new Date("2026-09-12T10:00:00.000Z");

describe("buildDashboardOverview", () => {
  it("returns a stable empty-account overview", () => {
    const overview = buildDashboardOverview({
      groups: [],
      rounds: [],
      suppliers: [],
    });
    expect(overview.metrics).toEqual({
      activeRoundCount: 0,
      attentionNeededCount: 0,
      potentialSavings: 0,
      readyForReviewCount: 0,
    });
    expect(overview.onboarding).toEqual({
      buyerComplete: false,
      groupComplete: false,
      roundComplete: false,
      supplierComplete: false,
    });
  });

  it("aggregates active, infeasible, reconfirmation, savings, and recent call state", () => {
    const baseRound = {
      group: { name: "Central buyers" },
      status: "active",
      supplier: { name: "Metro Supply" },
      unitLabel: "carton",
      updatedAt: now,
    };
    const overview = buildDashboardOverview({
      groups: [{ buyers: [{ businessName: "Asha Stores", id: "buyer-1" }] }],
      rounds: [
        {
          ...baseRound,
          calls: [
            {
              id: "new-call",
              mode: "real",
              purpose: "buyer_intake",
              roundId: "ready",
              status: "completed",
              targetId: "buyer-1",
              targetType: "buyer",
              updatedAt: now,
            },
          ],
          id: "ready",
          productName: "Cartons",
          proposals: [
            {
              combinedQty: 30,
              lineItems: [],
              savings: "1800",
              status: "ready_for_review",
              tierMinQty: 30,
              version: 1,
            },
          ],
        },
        {
          ...baseRound,
          calls: [
            {
              id: "old-call",
              mode: "simulated",
              purpose: "supplier_quote",
              roundId: "short",
              status: "completed",
              targetId: "supplier-1",
              targetType: "supplier",
              updatedAt: earlier,
            },
          ],
          id: "short",
          productName: "Bags",
          proposals: [
            {
              combinedQty: 28,
              lineItems: [],
              savings: null,
              status: "infeasible",
              tierMinQty: 30,
              version: 1,
            },
          ],
          updatedAt: earlier,
        },
        {
          ...baseRound,
          calls: [],
          id: "reconfirm",
          productName: "Labels",
          proposals: [
            {
              combinedQty: 40,
              lineItems: [{ confirmed: false, requiresReconfirmation: true }],
              savings: "500",
              status: "feasible_unconfirmed",
              tierMinQty: 40,
              version: 2,
            },
          ],
        },
      ],
      suppliers: [{ id: "supplier-1", name: "Metro Supply" }],
    });

    expect(overview.metrics).toEqual({
      activeRoundCount: 3,
      attentionNeededCount: 2,
      potentialSavings: 2300,
      readyForReviewCount: 1,
    });
    expect(overview.attentionItems.map((item) => item.kind)).toEqual([
      "shortfall",
      "reconfirmation",
    ]);
    expect(overview.recentCalls.map((item) => item.id)).toEqual([
      "new-call",
      "old-call",
    ]);
    expect(overview.recentCalls.map((item) => item.evidenceMode)).toEqual([
      "RECORDED",
      "SIMULATED",
    ]);
    expect(overview.onboarding).toEqual({
      buyerComplete: true,
      groupComplete: true,
      roundComplete: true,
      supplierComplete: true,
    });
  });
});
