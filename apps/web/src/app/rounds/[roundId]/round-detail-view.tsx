"use client";

import { Badge } from "@call-e-commonlot/ui/components/badge";
import { Button } from "@call-e-commonlot/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@call-e-commonlot/ui/components/card";
import { Input } from "@call-e-commonlot/ui/components/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  History,
  LayoutList,
  Phone,
  Radio,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { orpc } from "@/utils/orpc";

const currency = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  style: "currency",
});
const dateTime = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatMoney(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }
  return currency.format(Number(value));
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
        <details className="rounded-lg bg-muted/50 p-2">
          <summary className="cursor-pointer font-medium">
            Structured result
          </summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-[11px]">
            {JSON.stringify(call.structuredResult, null, 2)}
          </pre>
        </details>
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
  const [liveConfirmed, setLiveConfirmed] = useState(false);
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
  let submitLabel = "Review & place live call";
  if (dryRun) {
    submitLabel = "Run simulation";
  }
  if (trigger.isPending) {
    submitLabel = "Starting…";
  }

  return (
    <form
      className="space-y-2 border-t pt-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!(dryRun || liveConfirmed)) {
          return;
        }
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
          className="h-9 rounded-lg border border-input bg-card px-2.5 text-xs"
          onChange={(e) => setPurpose(e.target.value as typeof purpose)}
          value={purpose}
        >
          <option value="buyer_intake">Intake call</option>
          <option disabled={!canReconfirm} value="buyer_reconfirm">
            Reconfirm call
          </option>
        </select>
        <fieldset
          aria-label="Call mode"
          className="flex rounded-lg bg-muted p-0.5"
        >
          <Button
            onClick={() => {
              setDryRun(true);
              setLiveConfirmed(false);
            }}
            size="xs"
            type="button"
            variant={dryRun ? "outline" : "ghost"}
          >
            Simulation
          </Button>
          <Button
            onClick={() => setDryRun(false)}
            size="xs"
            type="button"
            variant={dryRun ? "ghost" : "outline"}
          >
            Live call
          </Button>
        </fieldset>
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
      {dryRun ? null : (
        <div className="rounded-lg bg-warning/10 p-2 text-warning text-xs">
          <Radio className="mr-1 inline size-3" />
          Live mode will call the buyer’s saved number for the selected purpose.
          <label className="mt-2 flex items-center gap-2 font-medium text-foreground">
            <input
              checked={liveConfirmed}
              onChange={(event) => setLiveConfirmed(event.target.checked)}
              type="checkbox"
            />
            I have reviewed the target and purpose
          </label>
        </div>
      )}
      <Button
        disabled={trigger.isPending || !(dryRun || liveConfirmed)}
        size="sm"
        type="submit"
      >
        {submitLabel}
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
  const [liveConfirmed, setLiveConfirmed] = useState(false);
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
  let submitLabel = "Review & place live call";
  if (dryRun) {
    submitLabel = "Run simulation";
  }
  if (trigger.isPending) {
    submitLabel = "Starting…";
  }

  return (
    <form
      className="space-y-2 border-t pt-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!(dryRun || liveConfirmed)) {
          return;
        }
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
          className="h-9 rounded-lg border border-input bg-card px-2.5 text-xs"
          onChange={(e) => setPurpose(e.target.value as typeof purpose)}
          value={purpose}
        >
          <option value="supplier_quote">Quote call</option>
          <option disabled={!canReconfirm} value="supplier_reconfirm">
            Reconfirm call
          </option>
        </select>
        <fieldset
          aria-label="Call mode"
          className="flex rounded-lg bg-muted p-0.5"
        >
          <Button
            onClick={() => {
              setDryRun(true);
              setLiveConfirmed(false);
            }}
            size="xs"
            type="button"
            variant={dryRun ? "outline" : "ghost"}
          >
            Simulation
          </Button>
          <Button
            onClick={() => setDryRun(false)}
            size="xs"
            type="button"
            variant={dryRun ? "ghost" : "outline"}
          >
            Live call
          </Button>
        </fieldset>
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
      {dryRun ? null : (
        <div className="rounded-lg bg-warning/10 p-2 text-warning text-xs">
          <Radio className="mr-1 inline size-3" />
          Live mode will call the supplier’s saved number. You’ll confirm once
          <label className="mt-2 flex items-center gap-2 font-medium text-foreground">
            <input
              checked={liveConfirmed}
              onChange={(event) => setLiveConfirmed(event.target.checked)}
              type="checkbox"
            />
            I have reviewed the target and purpose
          </label>
        </div>
      )}
      <Button
        disabled={trigger.isPending || !(dryRun || liveConfirmed)}
        size="sm"
        type="submit"
      >
        {submitLabel}
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
      <Card className="border-dashed bg-card/60">
        <CardHeader>
          <CardTitle>Proposal</CardTitle>
        </CardHeader>
        <CardContent className="pb-7 text-muted-foreground text-sm">
          No proposal yet — collect at least one buyer request and a supplier
          offer.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-primary/20 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            Proposal spotlight
          </span>
          <span
            className={`rounded-full px-2.5 py-1 font-medium text-xs ${
              proposal.feasible
                ? proposalStatusStyle[proposal.status]
                : proposalStatusStyle.infeasible
            }`}
          >
            {proposalStatusLabel[proposal.status] ?? proposal.status}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-7">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-muted/55 p-4">
            <p className="text-muted-foreground text-xs">Combined quantity</p>
            <p className="mt-1 font-semibold text-2xl text-tabular">
              {proposal.combinedQty}
            </p>
          </div>
          {proposal.feasible ? (
            <>
              <div className="rounded-xl bg-muted/55 p-4">
                <p className="text-muted-foreground text-xs">All-in price</p>
                <p className="mt-1 font-semibold text-2xl text-tabular">
                  {formatMoney(proposal.allInUnitPrice)}
                </p>
                <p className="text-muted-foreground text-xs">
                  Tier at {proposal.tierMinQty} units
                </p>
              </div>
              <div className="rounded-xl bg-muted/55 p-4">
                <p className="text-muted-foreground text-xs">Total cost</p>
                <p className="mt-1 font-semibold text-2xl text-tabular">
                  {formatMoney(proposal.totalCost)}
                </p>
              </div>
              {proposal.savings !== null && (
                <p className="rounded-xl bg-success/10 p-3 font-medium text-sm text-success sm:col-span-3">
                  Estimated saving against baseline:{" "}
                  {formatMoney(proposal.savings)}
                </p>
              )}
            </>
          ) : (
            <p className="rounded-xl bg-destructive/10 p-4 text-destructive text-sm sm:col-span-2">
              {proposal.shortfall === null
                ? "At least one buyer's total exceeds their authorized cap."
                : `Needs ${proposal.shortfall} more units to reach the next supplier tier.`}
            </p>
          )}
        </div>
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
  const [pendingStatus, setPendingStatus] = useState<
    (typeof orderStatusValues)[number] | null
  >(null);
  const record = useMutation(
    orpc.rounds.recordOrderStatus.mutationOptions({
      onSuccess: () => {
        setNote("");
        setPendingStatus(null);
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
        <ol className="grid gap-3 sm:grid-cols-4">
          {orderStatusValues.map((status) => (
            <li className="flex items-center gap-2 sm:block" key={status}>
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-full ${current === status ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {current === status ? (
                  <Check className="size-4" />
                ) : (
                  orderStatusValues.indexOf(status) + 1
                )}
              </span>
              <span className="mt-2 block text-xs">
                {orderStatusLabel[status]}
              </span>
            </li>
          ))}
        </ol>
        <Input
          className="max-w-sm"
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note"
          value={note}
        />
        <div className="flex flex-wrap gap-2">
          {orderStatusValues.map((status) => (
            <Button
              disabled={record.isPending || current === status}
              key={status}
              onClick={() => {
                const consequential =
                  status === "order_placed" || status === "goods_received";
                if (consequential) {
                  setPendingStatus(status);
                } else {
                  record.mutate({ note: note || undefined, roundId, status });
                }
              }}
              size="sm"
              variant="outline"
            >
              Mark {orderStatusLabel[status]}
            </Button>
          ))}
        </div>
        {pendingStatus ? (
          <div className="rounded-xl border border-warning/30 bg-warning/10 p-3">
            <p className="font-medium text-sm">
              Confirm {orderStatusLabel[pendingStatus]}
            </p>
            <p className="mt-1 text-muted-foreground text-xs">
              This consequential change will be added to the permanent organizer
              timeline.
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                onClick={() =>
                  record.mutate({
                    note: note || undefined,
                    roundId,
                    status: pendingStatus,
                  })
                }
                size="sm"
              >
                Confirm change
              </Button>
              <Button
                onClick={() => setPendingStatus(null)}
                size="sm"
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
        {orderEvents.length > 0 && (
          <ul className="space-y-1 border-t pt-2">
            {orderEvents.map((event) => (
              <li className="text-muted-foreground" key={event.id}>
                {orderStatusLabel[event.status]}
                {event.note ? ` — ${event.note}` : ""} (
                {dateTime.format(new Date(event.createdAt))})
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ParticipantOverview({
  buyers,
  requests,
  proposal,
}: {
  buyers: Buyer[];
  requests: RoundDetail["requests"];
  proposal: RoundDetail["proposal"];
}) {
  const requestByBuyer = new Map(requests.map((item) => [item.buyerId, item]));
  const lineByBuyer = new Map(
    (proposal?.lineItems ?? []).map((item) => [item.buyerId, item])
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Participant readiness</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="pb-3 font-medium">Buyer</th>
              <th className="pb-3 font-medium">Requested</th>
              <th className="pb-3 font-medium">Proposal</th>
              <th className="pb-3 font-medium">Readiness</th>
            </tr>
          </thead>
          <tbody>
            {buyers.map((buyer) => {
              const request = requestByBuyer.get(buyer.id);
              const line = lineByBuyer.get(buyer.id);
              const needsConfirmation =
                line?.requiresReconfirmation && !line.confirmed;
              let readiness = "Awaiting intake";
              if (request) {
                readiness = "Ready";
              }
              if (needsConfirmation) {
                readiness = "Reconfirmation needed";
              }
              return (
                <tr className="border-b last:border-0" key={buyer.id}>
                  <td className="py-4">
                    <p className="font-medium">{buyer.businessName}</p>
                    <p className="text-muted-foreground text-xs">
                      {buyer.contactName ?? buyer.phone}
                    </p>
                  </td>
                  <td className="py-4 text-tabular">
                    {request
                      ? `${request.quantity} · ${formatMoney(request.maxUnitPrice)}/unit`
                      : "Not collected"}
                  </td>
                  <td className="py-4 text-tabular">
                    {line
                      ? `${line.quantity} · ${formatMoney(line.totalCost)}`
                      : "—"}
                  </td>
                  <td className="py-4">
                    <Badge variant="outline">{readiness}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

export default function RoundDetailView({ roundId }: { roundId: string }) {
  const searchParams = useSearchParams();
  const requestedView = searchParams.get("view");
  const view =
    requestedView === "calls" || requestedView === "order"
      ? requestedView
      : "overview";
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

  const views = [
    { icon: LayoutList, label: "Overview", value: "overview" },
    { icon: Phone, label: "Calls", value: "calls" },
    { icon: History, label: "Order", value: "order" },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Link
            className="text-muted-foreground text-sm hover:text-foreground"
            href="/rounds"
          >
            Rounds /
          </Link>
          <h1 className="mt-1 font-semibold text-3xl tracking-tight">
            {r.productName}
          </h1>
          <p className="text-muted-foreground text-sm">
            {group?.name} · handling fee {formatMoney(r.handlingFeePerUnit)}/
            {r.unitLabel}
            {r.baselineUnitPrice
              ? ` · baseline ${formatMoney(r.baselineUnitPrice)}/${r.unitLabel}`
              : ""}
          </p>
        </div>
        <Badge variant="outline">{r.status}</Badge>
      </div>

      <ProposalPanel proposal={proposal} />

      <nav
        aria-label="Round views"
        className="flex w-full gap-1 overflow-x-auto rounded-xl bg-muted p-1 sm:w-fit"
      >
        {views.map(({ icon: Icon, label, value }) => (
          <Link
            aria-current={view === value ? "page" : undefined}
            className={`flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm ${view === value ? "bg-card font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            href={`/rounds/${roundId}?view=${value}`}
            key={value}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </nav>

      {view === "overview" ? (
        <div className="space-y-6">
          <ParticipantOverview
            buyers={group?.buyers ?? []}
            proposal={proposal}
            requests={requests}
          />
          <Card>
            <CardHeader>
              <CardTitle>Supplier terms</CardTitle>
            </CardHeader>
            <CardContent>
              {offer ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground text-xs">Supplier</p>
                    <p className="mt-1 font-medium">{supplier?.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">
                      Best available tier
                    </p>
                    <p className="mt-1 font-medium text-tabular">
                      {offer.tiers[0]?.minQty ?? "—"}+ at{" "}
                      {formatMoney(offer.tiers[0]?.pricePerUnit)}/unit
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Collection</p>
                    <p className="mt-1 font-medium">
                      {offer.collectionWindow ?? "Not specified"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No supplier offer collected yet. Open Calls to simulate or
                  place a quote call.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {view === "calls" ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-primary/20 bg-primary/[.035] p-4">
            <h2 className="font-semibold">Conversation controls</h2>
            <p className="mt-1 text-muted-foreground text-sm">
              Simulation is the safe default. Live calls always show the target
              and require final confirmation.
            </p>
          </div>
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
        </div>
      ) : null}

      {view === "order" ? (
        <OrderStatusStepper orderEvents={orderEvents} roundId={roundId} />
      ) : null}
    </div>
  );
}
