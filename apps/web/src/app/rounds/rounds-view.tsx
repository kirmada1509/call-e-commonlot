"use client";

import {
  Button,
  buttonVariants,
} from "@krishna-starter-kit/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@krishna-starter-kit/ui/components/card";
import { Input } from "@krishna-starter-kit/ui/components/input";
import { Label } from "@krishna-starter-kit/ui/components/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { orpc } from "@/utils/orpc";

const selectClassName =
  "h-8 w-full rounded-none border border-input bg-transparent px-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 dark:bg-input/30";

function NewRoundForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const groups = useQuery(orpc.groups.list.queryOptions());
  const suppliers = useQuery(orpc.suppliers.list.queryOptions());

  const [groupId, setGroupId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [productName, setProductName] = useState("");
  const [unitLabel, setUnitLabel] = useState("carton");
  const [handlingFeePerUnit, setHandlingFeePerUnit] = useState("0");
  const [baselineUnitPrice, setBaselineUnitPrice] = useState("");

  const createRound = useMutation(
    orpc.rounds.create.mutationOptions({
      onSuccess: (round) => {
        queryClient.invalidateQueries({ queryKey: orpc.rounds.key() });
        if (round) {
          router.push(`/rounds/${round.id}`);
        }
      },
    })
  );

  const canSubmit = groupId && supplierId && productName.trim();

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) {
          return;
        }
        createRound.mutate({
          baselineUnitPrice: baselineUnitPrice
            ? Number(baselineUnitPrice)
            : undefined,
          groupId,
          handlingFeePerUnit: Number(handlingFeePerUnit) || 0,
          productName: productName.trim(),
          supplierId,
          unitLabel: unitLabel.trim() || "carton",
        });
      }}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Group</Label>
          <select
            className={selectClassName}
            onChange={(e) => setGroupId(e.target.value)}
            value={groupId}
          >
            <option value="">Select a group...</option>
            {groups.data?.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} ({group.buyers.length} buyers)
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Supplier</Label>
          <select
            className={selectClassName}
            onChange={(e) => setSupplierId(e.target.value)}
            value={supplierId}
          >
            <option value="">Select a supplier...</option>
            {suppliers.data?.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="product-name">Product</Label>
        <Input
          id="product-name"
          onChange={(e) => setProductName(e.target.value)}
          placeholder="Unbranded takeaway bags (carton of 500)"
          value={productName}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="unit-label">Unit label</Label>
          <Input
            id="unit-label"
            onChange={(e) => setUnitLabel(e.target.value)}
            value={unitLabel}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="handling-fee">Handling fee / unit</Label>
          <Input
            id="handling-fee"
            onChange={(e) => setHandlingFeePerUnit(e.target.value)}
            type="number"
            value={handlingFeePerUnit}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="baseline-price">Baseline unit price (optional)</Label>
          <Input
            id="baseline-price"
            onChange={(e) => setBaselineUnitPrice(e.target.value)}
            placeholder="For a savings comparison"
            type="number"
            value={baselineUnitPrice}
          />
        </div>
      </div>

      <Button disabled={!canSubmit || createRound.isPending} type="submit">
        {createRound.isPending ? "Creating..." : "Start round"}
      </Button>
    </form>
  );
}

const roundStatusLabel: Record<string, string> = {
  active: "Active",
  archived: "Archived",
  draft: "Draft",
};

function RoundsList() {
  const rounds = useQuery(orpc.rounds.list.queryOptions());

  if (!rounds.data?.length) {
    return (
      <p className="text-muted-foreground text-sm">
        No rounds yet — start one above.
      </p>
    );
  }

  return (
    <ul className="divide-y">
      {rounds.data.map((round) => (
        <li className="flex items-center justify-between py-2" key={round.id}>
          <div>
            <Link
              className="font-medium hover:underline"
              href={`/rounds/${round.id}`}
            >
              {round.productName}
            </Link>
            <p className="text-muted-foreground text-xs">
              {roundStatusLabel[round.status] ?? round.status}
            </p>
          </div>
          <Link
            className={buttonVariants({ size: "sm", variant: "outline" })}
            href={`/rounds/${round.id}`}
          >
            Open
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function RoundsView() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Start a round</CardTitle>
        </CardHeader>
        <CardContent>
          <NewRoundForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rounds</CardTitle>
        </CardHeader>
        <CardContent>
          <RoundsList />
        </CardContent>
      </Card>
    </div>
  );
}
