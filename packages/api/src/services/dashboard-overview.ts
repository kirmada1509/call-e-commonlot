interface OverviewGroup {
  buyers: Array<{ businessName: string; id: string }>;
}
interface OverviewSupplier {
  id: string;
  name: string;
}
interface OverviewRound {
  calls: Array<{
    id: string;
    mode: string;
    purpose: string;
    roundId: string;
    status: string;
    targetId: string;
    targetType: string;
    updatedAt: Date;
  }>;
  group: { name: string } | null;
  id: string;
  productName: string;
  proposals: Array<{
    combinedQty: number;
    lineItems: Array<{ confirmed: boolean; requiresReconfirmation: boolean }>;
    savings: string | null;
    status: string;
    tierMinQty: number | null;
    version: number;
  }>;
  status: string;
  supplier: { name: string } | null;
  unitLabel: string;
  updatedAt: Date;
}

const callPurposeLabels: Record<string, string> = {
  buyer_intake: "Collect buying conditions",
  buyer_reconfirm: "Reconfirm proposal changes",
  supplier_quote: "Collect supplier offer",
  supplier_reconfirm: "Reconfirm supplier terms",
};
function getEvidenceMode(mode: string, status: string) {
  if (mode === "simulated") {
    return "SIMULATED" as const;
  }
  if (status === "completed") {
    return "RECORDED" as const;
  }
  return "LIVE" as const;
}

export function buildDashboardOverview({
  groups,
  rounds,
  suppliers,
}: {
  groups: OverviewGroup[];
  rounds: OverviewRound[];
  suppliers: OverviewSupplier[];
}) {
  const buyerNames = new Map(
    groups.flatMap((item) =>
      item.buyers.map((buyer) => [buyer.id, buyer.businessName] as const)
    )
  );
  const supplierNames = new Map(
    suppliers.map((item) => [item.id, item.name] as const)
  );
  const roundNames = new Map(
    rounds.map((item) => [item.id, item.productName] as const)
  );
  const summaries = rounds.map((round) => {
    const latestProposal =
      round.proposals.toSorted((a, b) => b.version - a.version)[0] ?? null;
    const confirmationsRequired =
      latestProposal?.lineItems.filter(
        (item) => item.requiresReconfirmation && !item.confirmed
      ).length ?? 0;
    return {
      attentionNeeded:
        latestProposal?.status === "infeasible" || confirmationsRequired > 0,
      combinedQty: latestProposal?.combinedQty ?? 0,
      confirmationsRequired,
      group: round.group?.name ?? "Unknown group",
      id: round.id,
      productName: round.productName,
      proposalStatus: latestProposal?.status ?? null,
      quantityTarget: latestProposal?.tierMinQty ?? null,
      savings: Number(latestProposal?.savings ?? 0),
      status: round.status,
      supplier: round.supplier?.name ?? "Unknown supplier",
      unitLabel: round.unitLabel,
      updatedAt: round.updatedAt,
    };
  });
  const recentCalls = rounds
    .flatMap((round) =>
      round.calls.map((item) => ({
        evidenceMode: getEvidenceMode(item.mode, item.status),
        id: item.id,
        purpose: callPurposeLabels[item.purpose] ?? item.purpose,
        roundId: item.roundId,
        roundName: roundNames.get(item.roundId) ?? "Purchase round",
        status: item.status,
        target:
          item.targetType === "buyer"
            ? (buyerNames.get(item.targetId) ?? "Buyer")
            : (supplierNames.get(item.targetId) ?? "Supplier"),
        timestamp: item.updatedAt,
      }))
    )
    .toSorted((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 8);
  const attentionItems = summaries
    .filter((item) => item.attentionNeeded)
    .map((item) => ({
      kind:
        item.proposalStatus === "infeasible"
          ? ("shortfall" as const)
          : ("reconfirmation" as const),
      message:
        item.proposalStatus === "infeasible"
          ? `${item.productName} has not reached a feasible supplier tier.`
          : `${item.confirmationsRequired} buyer confirmation${item.confirmationsRequired === 1 ? " is" : "s are"} still needed for ${item.productName}.`,
      roundId: item.id,
      timestamp: item.updatedAt,
    }));
  return {
    attentionItems,
    metrics: {
      activeRoundCount: summaries.filter((item) => item.status === "active")
        .length,
      attentionNeededCount: attentionItems.length,
      potentialSavings: summaries.reduce(
        (total, item) => total + Math.max(item.savings, 0),
        0
      ),
      readyForReviewCount: summaries.filter(
        (item) => item.proposalStatus === "ready_for_review"
      ).length,
    },
    onboarding: {
      buyerComplete: groups.some((item) => item.buyers.length > 0),
      groupComplete: groups.length > 0,
      roundComplete: rounds.length > 0,
      supplierComplete: suppliers.length > 0,
    },
    recentCalls,
    rounds: summaries,
  };
}
