"use client";

import { Badge } from "@call-e-commonlot/ui/components/badge";
import { Button, buttonVariants } from "@call-e-commonlot/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@call-e-commonlot/ui/components/card";
import { Skeleton } from "@call-e-commonlot/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CircleDollarSign,
  ClipboardCheck,
  PackageOpen,
  PhoneCall,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { orpc } from "@/utils/orpc";

const currency = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  maximumFractionDigits: 0,
  style: "currency",
});
const dateTime = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof PackageOpen;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="mt-0.5 font-semibold text-2xl text-tabular tracking-tight">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  const placeholders = ["active", "review", "attention", "savings"] as const;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {placeholders.map((placeholder) => (
          <Skeleton className="h-24 rounded-2xl" key={placeholder} />
        ))}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

export default function Dashboard() {
  const overview = useQuery(orpc.dashboard.overview.queryOptions());
  const [dismissed, setDismissed] = useState(true);
  useEffect(
    () =>
      setDismissed(
        window.localStorage.getItem("commonlot-onboarding-dismissed") === "true"
      ),
    []
  );

  if (overview.isLoading) {
    return <LoadingState />;
  }
  if (overview.isError || !overview.data) {
    return (
      <Card>
        <CardContent className="grid min-h-48 place-items-center text-center">
          <div>
            <AlertTriangle className="mx-auto size-7 text-warning" />
            <h2 className="mt-3 font-semibold">Overview couldn’t be loaded</h2>
            <p className="mt-1 text-muted-foreground text-sm">
              Your data is safe. Try fetching it again.
            </p>
            <Button
              className="mt-4"
              onClick={() => overview.refetch()}
              variant="outline"
            >
              <RotateCcw className="size-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { metrics, onboarding } = overview.data;
  const checklist = [
    {
      complete: onboarding.groupComplete,
      href: "/setup",
      label: "Create a buying group",
    },
    { complete: onboarding.buyerComplete, href: "/setup", label: "Add buyers" },
    {
      complete: onboarding.supplierComplete,
      href: "/setup",
      label: "Add a supplier",
    },
    {
      complete: onboarding.roundComplete,
      href: "/rounds?new=1",
      label: "Start the first round",
    },
  ] as const;
  const setupComplete = checklist.every((item) => item.complete);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={PackageOpen}
          label="Active rounds"
          value={metrics.activeRoundCount}
        />
        <MetricCard
          icon={ClipboardCheck}
          label="Ready for review"
          value={metrics.readyForReviewCount}
        />
        <MetricCard
          icon={AlertTriangle}
          label="Needs attention"
          value={metrics.attentionNeededCount}
        />
        <MetricCard
          icon={CircleDollarSign}
          label="Potential savings"
          value={currency.format(metrics.potentialSavings)}
        />
      </div>
      {setupComplete || dismissed ? null : (
        <Card className="border-primary/25 bg-primary/[.035]">
          <CardHeader className="flex-row items-start justify-between">
            <div>
              <CardTitle>Set up your purchasing network</CardTitle>
              <p className="mt-1 text-muted-foreground text-sm">
                Four quick steps unlock your first workable proposal.
              </p>
            </div>
            <Button
              aria-label="Dismiss onboarding"
              onClick={() => {
                window.localStorage.setItem(
                  "commonlot-onboarding-dismissed",
                  "true"
                );
                setDismissed(true);
              }}
              size="icon-sm"
              variant="ghost"
            >
              <X className="size-4" />
            </Button>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {checklist.map((item) => (
              <Link
                className="flex min-h-12 items-center gap-3 rounded-xl border bg-card px-3 text-sm hover:border-primary/35"
                href={item.href}
                key={item.label}
              >
                <span
                  className={`grid size-6 place-items-center rounded-full ${item.complete ? "bg-success text-white" : "bg-muted text-muted-foreground"}`}
                >
                  {item.complete ? (
                    <Check className="size-3.5" />
                  ) : (
                    <span className="size-2 rounded-full bg-current" />
                  )}
                </span>
                <span
                  className={
                    item.complete
                      ? "text-muted-foreground line-through"
                      : "font-medium"
                  }
                >
                  {item.label}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
      <div className="grid gap-6 xl:grid-cols-[1.45fr_.8fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Active rounds</CardTitle>
            <Link
              className={buttonVariants({ size: "sm" })}
              href="/rounds?new=1"
            >
              <Plus className="size-4" />
              Start round
            </Link>
          </CardHeader>
          <CardContent>
            {overview.data.rounds.length ? (
              <div className="divide-y">
                {overview.data.rounds.slice(0, 6).map((round) => (
                  <Link
                    className="grid min-h-20 items-center gap-3 py-3 hover:bg-muted/35 sm:grid-cols-[1fr_auto_auto] sm:px-2"
                    href={`/rounds/${round.id}`}
                    key={round.id}
                  >
                    <div>
                      <p className="font-medium">{round.productName}</p>
                      <p className="mt-1 text-muted-foreground text-xs">
                        {round.group} · {round.supplier}
                      </p>
                    </div>
                    <div className="text-sm sm:text-right">
                      <p className="text-tabular">
                        {round.combinedQty}
                        {round.quantityTarget
                          ? ` / ${round.quantityTarget}`
                          : ""}{" "}
                        {round.unitLabel}s
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {currency.format(round.savings)} saving
                      </p>
                    </div>
                    <ArrowRight className="hidden size-4 text-muted-foreground sm:block" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="grid min-h-52 place-items-center text-center">
                <div>
                  <PackageOpen className="mx-auto size-8 text-muted-foreground" />
                  <h3 className="mt-3 font-medium">No purchase rounds yet</h3>
                  <p className="mt-1 max-w-sm text-muted-foreground text-sm">
                    Once your network is ready, start a round to collect
                    conditions and assemble a proposal.
                  </p>
                  <Link
                    className={buttonVariants({
                      className: "mt-4",
                      size: "sm",
                    })}
                    href="/rounds?new=1"
                  >
                    Start a round
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
          </CardHeader>
          <CardContent>
            {overview.data.attentionItems.length ? (
              <div className="space-y-2">
                {overview.data.attentionItems.map((item) => (
                  <Link
                    className="block rounded-xl border bg-card p-3 hover:border-warning/50"
                    href={`/rounds/${item.roundId}`}
                    key={`${item.roundId}-${item.kind}`}
                  >
                    <Badge variant="outline">
                      {item.kind === "shortfall" ? "Shortfall" : "Reconfirm"}
                    </Badge>
                    <p className="mt-2 text-sm leading-5">{item.message}</p>
                    <p className="mt-2 text-muted-foreground text-xs">
                      {dateTime.format(new Date(item.timestamp))}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="grid min-h-40 place-items-center text-center">
                <div>
                  <Check className="mx-auto size-7 text-success" />
                  <p className="mt-2 font-medium text-sm">
                    Everything is moving
                  </p>
                  <p className="text-muted-foreground text-xs">
                    No rounds need intervention.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent call activity</CardTitle>
        </CardHeader>
        <CardContent>
          {overview.data.recentCalls.length ? (
            <div className="divide-y">
              {overview.data.recentCalls.map((item) => (
                <div className="flex items-center gap-3 py-3" key={item.id}>
                  <span className="grid size-9 place-items-center rounded-xl bg-muted">
                    <PhoneCall className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">
                      {item.target} · {item.purpose}
                    </p>
                    <p className="truncate text-muted-foreground text-xs">
                      {item.roundName} ·{" "}
                      {dateTime.format(new Date(item.timestamp))}
                    </p>
                  </div>
                  <Badge variant="outline">{item.evidenceMode}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-muted-foreground text-sm">
              Live, recorded, and simulated call evidence will appear here.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
