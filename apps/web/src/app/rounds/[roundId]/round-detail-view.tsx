"use client";

import { Button } from "@krishna-starter-kit/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@krishna-starter-kit/ui/components/card";
import { Checkbox } from "@krishna-starter-kit/ui/components/checkbox";
import { Input } from "@krishna-starter-kit/ui/components/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { orpc } from "@/utils/orpc";

function formatMoney(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

type RoundDetail = NonNullable<
  Awaited<ReturnType<(typeof orpc)["rounds"]["get"]["call"]>>
>;
type Buyer = NonNullable<RoundDetail["group"]>["buyers"][number];
type Call = RoundDetail["calls"][number];

function hasPendingRealCalls(calls: Call[] | undefined) {
  return (calls ?? []).some(
    (c) =>
      c.mode === "real" && (c.status === "queued" || c.status === "in_progress")
  );
}

const proposalStatusStyle: Record<string, string> = {
  feasible_unconfirmed: "bg-amber-100 text-amber-900",
  infeasible: "bg-red-100 text-red-900",
  ready_for_review: "bg-green-100 text-green-900",
};

const proposalStatusLabel: Record<string, string> = {
  feasible_unconfirmed: "Feasible — awaiting confirmations",
  infeasible: "Not feasible",
  ready_for_review: "Ready for organizer review",
};

const orderStatusValues = [
  "proposal_ready",
  "organizer_approved",
  "order_placed",
  "goods_received",
] as const;

const orderStatusLabel: Record<string, string> = {
  goods_received: "Goods received",
  order_placed: "Order placed",
  organizer_approved: "Organizer approved",
  proposal_ready: "Proposal ready",
};

// The doc requires distinguishing a live result, a recorded real result,
// and a simulation. A "real" call is LIVE while still in flight and
// RECORDED once it reaches a terminal state (the transcript/result being
// reviewed is a genuine past CALL-E event, not something happening now).
// A "simulated" (dry-run) call is never LIVE or RECORDED.
function callEvidenceLabel(call: Call): "LIVE" | "RECORDED" | "SIMULATED" {
  if (call.mode !== "real") {
    return "SIMULATED";
  }
  return call.status === "queued" || call.status === "in_progress"
    ? "LIVE"
    : "RECORDED";
}

const evidenceLabelStyle: Record<string, string> = {
  LIVE: "bg-green-100 text-green-900",
  RECORDED: "bg-blue-100 text-blue-900",
  SIMULATED: "bg-slate-100 text-slate-700",
};

function CallActivityItem({ call }: { call: Call }) {
  const [showTranscript, setShowTranscript] = useState(false);
  const transcript = (call.transcript ?? []) as Array<{
    speaker: string;
    text: string;
  }>;
  const evidenceLabel = callEvidenceLabel(call);

  return (
    <li className="space-y-1 border-b py-2 text-xs last:border-b-0">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`px-1.5 py-0.5 font-medium ${evidenceLabelStyle[evidenceLabel]}`}
        >
          {evidenceLabel}
        </span>
        <span className="font-medium">{call.purpose}</span>
        <span className="text-muted-foreground">{call.status}</span>
        {call.errorMessage ? (
          <span className="text-red-700">{call.errorMessage}</span>
        ) : null}
      </div>
      {call.structuredResult ? (
        <pre className="overflow-x-auto bg-muted/50 p-1.5 text-[11px]">
          {JSON.stringify(call.structuredResult)}
        </pre>
      ) : null}
      {transcript.length > 0 && (
        <div>
          <Button
            onClick={() => setShowTranscript((v) => !v)}
            size="xs"
            variant="ghost"
          >
            {showTranscript
              ? "Hide transcript"
              : `Show transcript (${transcript.length} turns)`}
          </Button>
          {showTranscript ? (
            <div className="mt-1 space-y-0.5 bg-muted/30 p-1.5">
              {transcript.map((turn, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: transcript turns have no stable id
                <p key={i}>
                  <span className="font-medium">{turn.speaker}:</span>{" "}
                  {turn.text}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </li>
  );
}

function BuyerCallForm({
  roundId,
  buyerId,
  canReconfirm,
}: {
  roundId: string;
  buyerId: string;
  canReconfirm: boolean;
}) {
  const queryClient = useQueryClient();
  const [purpose, setPurpose] = useState<"buyer_intake" | "buyer_reconfirm">(
    "buyer_intake"
  );
  const [dryRun, setDryRun] = useState(true);
  const [quantity, setQuantity] = useState("");
  const [maxUnitPrice, setMaxUnitPrice] = useState("");
  const [maxTotal, setMaxTotal] = useState("");

  const trigger = useMutation(
    orpc.rounds.triggerBuyerCall.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.rounds.get.queryKey({ input: { roundId } }),
        });
      },
    })
  );

  return (
    <form
      className="space-y-2 border-t pt-2"
      onSubmit={(e) => {
        e.preventDefault();
        trigger.mutate({
          buyerId,
          dryRun,
          purpose,
          roundId,
          simulatedResult: dryRun
            ? {
                maxTotal: maxTotal ? Number(maxTotal) : "unknown",
                maxUnitPrice: maxUnitPrice ? Number(maxUnitPrice) : "unknown",
                quantity: quantity ? Number(quantity) : "unknown",
              }
            : undefined,
        });
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="h-7 rounded-none border border-input bg-transparent px-1.5 text-xs"
          onChange={(e) => setPurpose(e.target.value as typeof purpose)}
          value={purpose}
        >
          <option value="buyer_intake">Intake call</option>
          <option disabled={!canReconfirm} value="buyer_reconfirm">
            Reconfirm call
          </option>
        </select>
        <label
          className="flex items-center gap-1.5 text-xs"
          htmlFor={`${buyerId}-dry-run`}
        >
          <Checkbox
            checked={dryRun}
            id={`${buyerId}-dry-run`}
            onCheckedChange={(checked) => setDryRun(checked === true)}
          />
          Dry run (no real call)
        </label>
      </div>
      {dryRun ? (
        <div className="grid grid-cols-3 gap-1.5">
          <Input
            aria-label="Simulated quantity"
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Qty"
            type="number"
            value={quantity}
          />
          <Input
            aria-label="Simulated max unit price"
            onChange={(e) => setMaxUnitPrice(e.target.value)}
            placeholder="Max ₹/unit"
            type="number"
            value={maxUnitPrice}
          />
          <Input
            aria-label="Simulated max total"
            onChange={(e) => setMaxTotal(e.target.value)}
            placeholder="Max total"
            type="number"
            value={maxTotal}
          />
        </div>
      ) : null}
      <Button disabled={trigger.isPending} size="sm" type="submit">
        {trigger.isPending ? "Placing call..." : "Place call"}
      </Button>
    </form>
  );
}

function BuyerCard({
  roundId,
  buyer,
  request,
  lineItem,
  calls,
}: {
  roundId: string;
  buyer: Buyer;
  request: RoundDetail["requests"][number] | undefined;
  lineItem:
    | NonNullable<RoundDetail["proposal"]>["lineItems"][number]
    | undefined;
  calls: Call[];
}) {
  const queryClient = useQueryClient();
  const confirm = useMutation(
    orpc.rounds.confirmLineItem.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.rounds.get.queryKey({ input: { roundId } }),
        });
      },
    })
  );

  const buyerCalls = calls.filter(
    (c) => c.targetType === "buyer" && c.targetId === buyer.id
  );
  const [latestCall] = buyerCalls;
  const pending = Boolean(
    latestCall &&
      (latestCall.status === "queued" || latestCall.status === "in_progress")
  );
  const needsReconfirmation = Boolean(
    lineItem?.requiresReconfirmation && !lineItem.confirmed
  );

  let status = "Not contacted";
  if (pending) {
    status = "Call pending";
  } else if (needsReconfirmation) {
    status = "Needs reconfirmation";
  } else if (request) {
    status = "Collected";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{buyer.businessName}</span>
          <span className="font-normal text-muted-foreground text-xs">
            {status}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <p className="text-muted-foreground">
          {buyer.contactName ? `${buyer.contactName} · ` : ""}
          {buyer.phone}
        </p>
        {request ? (
          <p>
            Requested: {request.quantity} @ up to{" "}
            {formatMoney(request.maxUnitPrice)}
            /unit, max {formatMoney(request.maxTotal)} total ({request.source})
          </p>
        ) : null}
        {lineItem ? (
          <p className={lineItem.withinCap ? "" : "text-red-700"}>
            In current proposal: {lineItem.quantity} @{" "}
            {formatMoney(lineItem.allInUnitPrice)} ={" "}
            {formatMoney(lineItem.totalCost)}
            {lineItem.withinCap ? "" : " — exceeds this buyer's cap"}
          </p>
        ) : null}
        {needsReconfirmation ? (
          <Button
            disabled={confirm.isPending}
            onClick={() => confirm.mutate({ lineItemId: lineItem?.id ?? "" })}
            size="sm"
            variant="outline"
          >
            {confirm.isPending ? "Confirming..." : "Confirm new total"}
          </Button>
        ) : null}
        {buyerCalls.length > 0 && (
          <ul>
            {buyerCalls.slice(0, 3).map((c) => (
              <CallActivityItem call={c} key={c.id} />
            ))}
          </ul>
        )}
        <BuyerCallForm
          buyerId={buyer.id}
          canReconfirm={Boolean(lineItem)}
          roundId={roundId}
        />
      </CardContent>
    </Card>
  );
}

function SupplierCallForm({
  roundId,
  canReconfirm,
}: {
  roundId: string;
  canReconfirm: boolean;
}) {
  const queryClient = useQueryClient();
  const [purpose, setPurpose] = useState<
    "supplier_quote" | "supplier_reconfirm"
  >("supplier_quote");
  const [dryRun, setDryRun] = useState(true);
  const [minQty, setMinQty] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [collectionWindow, setCollectionWindow] = useState("");
  const [conditions, setConditions] = useState("");

  const trigger = useMutation(
    orpc.rounds.triggerSupplierCall.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.rounds.get.queryKey({ input: { roundId } }),
        });
      },
    })
  );

  return (
    <form
      className="space-y-2 border-t pt-2"
      onSubmit={(e) => {
        e.preventDefault();
        trigger.mutate({
          dryRun,
          purpose,
          roundId,
          simulatedResult:
            dryRun && minQty && pricePerUnit
              ? {
                  collectionWindow: collectionWindow || undefined,
                  conditions: conditions || undefined,
                  tiers: [
                    {
                      minQty: Number(minQty),
                      pricePerUnit: Number(pricePerUnit),
                    },
                  ],
                }
              : undefined,
        });
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="h-7 rounded-none border border-input bg-transparent px-1.5 text-xs"
          onChange={(e) => setPurpose(e.target.value as typeof purpose)}
          value={purpose}
        >
          <option value="supplier_quote">Quote call</option>
          <option disabled={!canReconfirm} value="supplier_reconfirm">
            Reconfirm call
          </option>
        </select>
        <label
          className="flex items-center gap-1.5 text-xs"
          htmlFor="supplier-dry-run"
        >
          <Checkbox
            checked={dryRun}
            id="supplier-dry-run"
            onCheckedChange={(checked) => setDryRun(checked === true)}
          />
          Dry run (no real call)
        </label>
      </div>
      {dryRun ? (
        <div className="grid grid-cols-2 gap-1.5">
          <Input
            aria-label="Simulated tier minimum quantity"
            onChange={(e) => setMinQty(e.target.value)}
            placeholder="Tier min qty"
            type="number"
            value={minQty}
          />
          <Input
            aria-label="Simulated tier price per unit"
            onChange={(e) => setPricePerUnit(e.target.value)}
            placeholder="Price/unit"
            type="number"
            value={pricePerUnit}
          />
          <Input
            aria-label="Simulated collection window"
            onChange={(e) => setCollectionWindow(e.target.value)}
            placeholder="Collection window (optional)"
            value={collectionWindow}
          />
          <Input
            aria-label="Simulated conditions"
            onChange={(e) => setConditions(e.target.value)}
            placeholder="Conditions (optional)"
            value={conditions}
          />
        </div>
      ) : null}
      <Button disabled={trigger.isPending} size="sm" type="submit">
        {trigger.isPending ? "Placing call..." : "Place call"}
      </Button>
    </form>
  );
}

function SupplierCard({
  roundId,
  supplier,
  offer,
  calls,
  hasProposal,
}: {
  roundId: string;
  supplier: RoundDetail["supplier"];
  offer: RoundDetail["offer"];
  calls: Call[];
  hasProposal: boolean;
}) {
  if (!supplier) {
    return null;
  }

  const supplierCalls = calls.filter(
    (c) => c.targetType === "supplier" && c.targetId === supplier.id
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{supplier.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <p className="text-muted-foreground">{supplier.phone}</p>
        {offer ? (
          <div>
            <p className="font-medium">Tiers:</p>
            <ul>
              {offer.tiers.map((tier) => (
                <li key={tier.minQty}>
                  {tier.minQty}+ units → {formatMoney(tier.pricePerUnit)}/unit
                </li>
              ))}
            </ul>
            {offer.collectionWindow ? (
              <p>Collection: {offer.collectionWindow}</p>
            ) : null}
            {offer.conditions ? <p>Conditions: {offer.conditions}</p> : null}
          </div>
        ) : (
          <p className="text-muted-foreground">No supplier offer yet.</p>
        )}
        {supplierCalls.length > 0 && (
          <ul>
            {supplierCalls.slice(0, 3).map((c) => (
              <CallActivityItem call={c} key={c.id} />
            ))}
          </ul>
        )}
        <SupplierCallForm canReconfirm={hasProposal} roundId={roundId} />
      </CardContent>
    </Card>
  );
}

function ProposalPanel({ proposal }: { proposal: RoundDetail["proposal"] }) {
  if (!proposal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Proposal</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-xs">
          No proposal yet — collect at least one buyer request and a supplier
          offer.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Proposal</span>
          <span
            className={`px-2 py-0.5 font-medium text-xs ${
              proposal.feasible
                ? proposalStatusStyle[proposal.status]
                : proposalStatusStyle.infeasible
            }`}
          >
            {proposalStatusLabel[proposal.status] ?? proposal.status}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-xs">
        <p>Combined quantity: {proposal.combinedQty}</p>
        {proposal.feasible ? (
          <>
            <p>
              All-in price: {formatMoney(proposal.allInUnitPrice)}/unit (tier
              reached at {proposal.tierMinQty})
            </p>
            <p>Total cost: {formatMoney(proposal.totalCost)}</p>
            {proposal.savings !== null && (
              <p className="text-green-800">
                Estimated savings vs. baseline: {formatMoney(proposal.savings)}
              </p>
            )}
          </>
        ) : (
          <p className="text-red-700">
            {proposal.shortfall === null
              ? "At least one buyer's total exceeds their authorized cap."
              : `Needs ${proposal.shortfall} more units to reach the next supplier tier.`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function OrderStatusStepper({
  roundId,
  orderEvents,
}: {
  roundId: string;
  orderEvents: RoundDetail["orderEvents"];
}) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const record = useMutation(
    orpc.rounds.recordOrderStatus.mutationOptions({
      onSuccess: () => {
        setNote("");
        queryClient.invalidateQueries({
          queryKey: orpc.rounds.get.queryKey({ input: { roundId } }),
        });
      },
    })
  );

  const current = orderEvents[0]?.status;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <p className="text-muted-foreground">
          Current: {current ? orderStatusLabel[current] : "Not started"}
        </p>
        <p className="text-muted-foreground">
          This is a manual, organizer-only ledger — separate from the proposal's
          feasibility status.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {orderStatusValues.map((status) => (
            <Button
              disabled={record.isPending}
              key={status}
              onClick={() =>
                record.mutate({ note: note || undefined, roundId, status })
              }
              size="sm"
              variant={current === status ? "default" : "outline"}
            >
              {orderStatusLabel[status]}
            </Button>
          ))}
        </div>
        <Input
          className="max-w-sm"
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note"
          value={note}
        />
        {orderEvents.length > 0 && (
          <ul className="space-y-1 border-t pt-2">
            {orderEvents.map((event) => (
              <li className="text-muted-foreground" key={event.id}>
                {orderStatusLabel[event.status]}
                {event.note ? ` — ${event.note}` : ""} (
                {new Date(event.createdAt).toLocaleString()})
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default function RoundDetailView({ roundId }: { roundId: string }) {
  const round = useQuery(
    orpc.rounds.get.queryOptions({
      input: { roundId },
      refetchInterval: (query) =>
        hasPendingRealCalls(query.state.data?.calls) ? 4000 : false,
    })
  );

  if (round.isLoading) {
    return <p className="text-muted-foreground text-sm">Loading round...</p>;
  }
  if (!round.data) {
    return <p className="text-muted-foreground text-sm">Round not found.</p>;
  }

  const {
    round: r,
    group,
    supplier,
    requests,
    offer,
    proposal,
    calls,
    orderEvents,
  } = round.data;

  const lineItemByBuyer = new Map(
    (proposal?.lineItems ?? []).map((li) => [li.buyerId, li])
  );
  const requestByBuyer = new Map(requests.map((req) => [req.buyerId, req]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-xl">{r.productName}</h1>
        <p className="text-muted-foreground text-sm">
          {group?.name} · handling fee {formatMoney(r.handlingFeePerUnit)}/
          {r.unitLabel}
          {r.baselineUnitPrice
            ? ` · baseline ${formatMoney(r.baselineUnitPrice)}/${r.unitLabel}`
            : ""}
        </p>
      </div>

      <ProposalPanel proposal={proposal} />

      <div className="space-y-3">
        <h2 className="font-medium text-sm">Buyers</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {group?.buyers.map((buyer) => (
            <BuyerCard
              buyer={buyer}
              calls={calls}
              key={buyer.id}
              lineItem={lineItemByBuyer.get(buyer.id)}
              request={requestByBuyer.get(buyer.id)}
              roundId={roundId}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-medium text-sm">Supplier</h2>
        <SupplierCard
          calls={calls}
          hasProposal={Boolean(proposal)}
          offer={offer}
          roundId={roundId}
          supplier={supplier}
        />
      </div>

      <OrderStatusStepper orderEvents={orderEvents} roundId={roundId} />
    </div>
  );
}
