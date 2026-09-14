"use client";

import { Badge } from "@call-e-commonlot/ui/components/badge";
import { Button } from "@call-e-commonlot/ui/components/button";
import { Card, CardContent } from "@call-e-commonlot/ui/components/card";
import { Input } from "@call-e-commonlot/ui/components/input";
import { Label } from "@call-e-commonlot/ui/components/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@call-e-commonlot/ui/components/sheet";
import { Skeleton } from "@call-e-commonlot/ui/components/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, PackageOpen, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { orpc } from "@/utils/orpc";

const selectClassName =
  "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";
const currency = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  maximumFractionDigits: 0,
  style: "currency",
});
const relative = new Intl.RelativeTimeFormat("en-IN", { numeric: "auto" });
function relativeDate(value: Date | string) {
  const days = Math.round(
    (new Date(value).getTime() - Date.now()) / 86_400_000
  );
  return Math.abs(days) < 7
    ? relative.format(days, "day")
    : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
        new Date(value)
      );
}

function NewRoundForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const groups = useQuery(orpc.groups.list.queryOptions());
  const suppliers = useQuery(orpc.suppliers.list.queryOptions());
  const [values, setValues] = useState({
    baselineUnitPrice: "",
    groupId: "",
    handlingFeePerUnit: "0",
    productName: "",
    supplierId: "",
    unitLabel: "carton",
  });
  const createRound = useMutation(
    orpc.rounds.create.mutationOptions({
      onSuccess: (round) => {
        queryClient.invalidateQueries({ queryKey: orpc.dashboard.key() });
        if (round) {
          router.push(`/rounds/${round.id}`);
        }
      },
    })
  );
  const update = (key: keyof typeof values, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));
  const canSubmit =
    values.groupId && values.supplierId && values.productName.trim();
  return (
    <form
      className="space-y-5 px-5 pb-8"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) {
          createRound.mutate({
            baselineUnitPrice: values.baselineUnitPrice
              ? Number(values.baselineUnitPrice)
              : undefined,
            groupId: values.groupId,
            handlingFeePerUnit: Number(values.handlingFeePerUnit) || 0,
            productName: values.productName.trim(),
            supplierId: values.supplierId,
            unitLabel: values.unitLabel.trim() || "carton",
          });
        }
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="round-product">Product</Label>
        <Input
          autoFocus
          id="round-product"
          onChange={(event) => update("productName", event.target.value)}
          placeholder="Takeaway cartons"
          value={values.productName}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="round-group">Buying group</Label>
        <select
          className={selectClassName}
          id="round-group"
          onChange={(event) => update("groupId", event.target.value)}
          value={values.groupId}
        >
          <option value="">Choose a group</option>
          {groups.data?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} · {item.buyers.length} buyers
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="round-supplier">Supplier</Label>
        <select
          className={selectClassName}
          id="round-supplier"
          onChange={(event) => update("supplierId", event.target.value)}
          value={values.supplierId}
        >
          <option value="">Choose a supplier</option>
          {suppliers.data?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="unit-label">Unit label</Label>
          <Input
            id="unit-label"
            onChange={(event) => update("unitLabel", event.target.value)}
            value={values.unitLabel}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="handling-fee">Handling / unit</Label>
          <Input
            id="handling-fee"
            min="0"
            onChange={(event) =>
              update("handlingFeePerUnit", event.target.value)
            }
            type="number"
            value={values.handlingFeePerUnit}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="baseline-price">
          Baseline unit price{" "}
          <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="baseline-price"
          min="0"
          onChange={(event) => update("baselineUnitPrice", event.target.value)}
          placeholder="Used to calculate savings"
          type="number"
          value={values.baselineUnitPrice}
        />
      </div>
      {groups.data?.length === 0 || suppliers.data?.length === 0 ? (
        <p className="rounded-xl bg-warning/10 p-3 text-sm text-warning">
          Add at least one group and supplier in Network before starting.
        </p>
      ) : null}
      <Button
        className="w-full"
        disabled={!canSubmit || createRound.isPending}
        type="submit"
      >
        {createRound.isPending ? "Starting…" : "Start round"}
      </Button>
    </form>
  );
}

export default function RoundsView() {
  const router = useRouter();
  const params = useSearchParams();
  const overview = useQuery(orpc.dashboard.overview.queryOptions());
  const query = params.get("query") ?? "";
  const status = params.get("status") ?? "all";
  const proposal = params.get("proposal") ?? "all";
  const sheetOpen = params.get("new") === "1";
  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "all") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    router.replace(`/rounds?${next.toString()}`);
  };
  const rounds =
    overview.data?.rounds.filter(
      (item) =>
        item.productName.toLowerCase().includes(query.toLowerCase()) &&
        (status === "all" || item.status === status) &&
        (proposal === "all" || item.proposalStatus === proposal)
    ) ?? [];
  const loadingRows = ["first", "second", "third"] as const;
  return (
    <>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-medium text-primary text-sm">Operations</p>
          <h1 className="mt-1 font-semibold text-3xl tracking-tight">
            Purchase rounds
          </h1>
          <p className="mt-2 text-muted-foreground">
            Track every pooled purchase from first conversation to final order.
          </p>
        </div>
        <Button onClick={() => setParam("new", "1")}>
          <Plus className="size-4" />
          Start round
        </Button>
      </div>
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_210px]">
            <div className="relative">
              <Search className="absolute top-3 left-3 size-4 text-muted-foreground" />
              <Input
                aria-label="Search rounds"
                className="pl-9"
                onChange={(event) => setParam("query", event.target.value)}
                placeholder="Search products"
                value={query}
              />
            </div>
            <label className="sr-only" htmlFor="round-status">
              Round status
            </label>
            <select
              className={selectClassName}
              id="round-status"
              onChange={(event) => setParam("status", event.target.value)}
              value={status}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <label className="sr-only" htmlFor="proposal-status">
              Proposal status
            </label>
            <select
              className={selectClassName}
              id="proposal-status"
              onChange={(event) => setParam("proposal", event.target.value)}
              value={proposal}
            >
              <option value="all">All proposals</option>
              <option value="infeasible">Infeasible</option>
              <option value="feasible_unconfirmed">
                Awaiting confirmation
              </option>
              <option value="ready_for_review">Ready for review</option>
            </select>
          </div>
        </CardContent>
      </Card>
      <div className="mt-5 space-y-3">
        {overview.isLoading
          ? loadingRows.map((row) => (
              <Skeleton className="h-28 rounded-2xl" key={row} />
            ))
          : null}
        {overview.isLoading || rounds.length === 0
          ? null
          : rounds.map((round) => (
              <Link
                className="grid min-h-28 items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md md:grid-cols-[1.2fr_.8fr_.65fr_auto]"
                href={`/rounds/${round.id}`}
                key={round.id}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-lg">
                      {round.productName}
                    </h2>
                    {round.attentionNeeded ? (
                      <span
                        aria-label="Needs attention"
                        className="size-2 rounded-full bg-warning"
                        role="img"
                      />
                    ) : null}
                  </div>
                  <p className="mt-1 text-muted-foreground text-sm">
                    {round.group} · {round.supplier}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">
                    Quantity progress
                  </p>
                  <p className="mt-1 font-medium text-tabular">
                    {round.combinedQty}
                    {round.quantityTarget ? ` / ${round.quantityTarget}` : ""}{" "}
                    {round.unitLabel}s
                  </p>
                </div>
                <div>
                  <Badge variant="outline">
                    {round.proposalStatus?.replaceAll("_", " ") ??
                      "Collecting inputs"}
                  </Badge>
                  <p className="mt-2 text-muted-foreground text-xs">
                    Updated {relativeDate(round.updatedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3 md:justify-end">
                  <span className="font-semibold text-success text-tabular">
                    {round.savings > 0 ? currency.format(round.savings) : "—"}
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
        {overview.isLoading || rounds.length > 0 ? null : (
          <div className="grid min-h-72 place-items-center rounded-2xl border border-dashed bg-card/55 text-center">
            <div>
              <PackageOpen className="mx-auto size-9 text-muted-foreground" />
              <h2 className="mt-3 font-semibold">No matching rounds</h2>
              <p className="mt-1 text-muted-foreground text-sm">
                Adjust the filters or begin a new purchase round.
              </p>
              <Button
                className="mt-4"
                onClick={() => setParam("new", "1")}
                variant="outline"
              >
                <Plus className="size-4" />
                Start round
              </Button>
            </div>
          </div>
        )}
      </div>
      <Sheet
        onOpenChange={(open) => {
          if (!open) {
            setParam("new", "");
          }
        }}
        open={sheetOpen}
      >
        <SheetContent className="w-full overflow-y-auto bg-background/95 backdrop-blur-xl sm:max-w-lg">
          <SheetHeader className="p-5">
            <SheetTitle className="text-xl">Start a purchase round</SheetTitle>
            <SheetDescription>
              Choose the network and product. Buyer and supplier conditions come
              next.
            </SheetDescription>
          </SheetHeader>
          <NewRoundForm />
        </SheetContent>
      </Sheet>
    </>
  );
}
