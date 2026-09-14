"use client";

import { Button } from "@call-e-commonlot/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@call-e-commonlot/ui/components/card";
import { Input } from "@call-e-commonlot/ui/components/input";
import { Label } from "@call-e-commonlot/ui/components/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@call-e-commonlot/ui/components/sheet";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Phone, Plus, Store, Users } from "lucide-react";
import { useState } from "react";

import { orpc } from "@/utils/orpc";

function NewGroupForm({ onCreated }: { onCreated: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const createGroup = useMutation(
    orpc.groups.create.mutationOptions({
      onSuccess: () => {
        setName("");
        queryClient.invalidateQueries({ queryKey: orpc.groups.key() });
        onCreated();
      },
    })
  );

  return (
    <form
      className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) {
          createGroup.mutate({ name: name.trim() });
        }
      }}
    >
      <div className="flex-1 space-y-1">
        <Label htmlFor="group-name">New group name</Label>
        <Input
          id="group-name"
          onChange={(e) => setName(e.target.value)}
          placeholder="Local Bag Co-op"
          value={name}
        />
      </div>
      <Button disabled={createGroup.isPending || !name.trim()} type="submit">
        {createGroup.isPending ? "Creating..." : "Create group"}
      </Button>
    </form>
  );
}

function AddBuyerForm({ groupId }: { groupId: string }) {
  const queryClient = useQueryClient();
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const addBuyer = useMutation(
    orpc.groups.addBuyer.mutationOptions({
      onSuccess: () => {
        setBusinessName("");
        setContactName("");
        setPhone("");
        queryClient.invalidateQueries({ queryKey: orpc.groups.key() });
      },
    })
  );

  return (
    <form
      className="grid grid-cols-1 gap-2 sm:grid-cols-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (businessName.trim() && phone.trim()) {
          addBuyer.mutate({
            businessName: businessName.trim(),
            contactName: contactName.trim() || undefined,
            groupId,
            phone: phone.trim(),
          });
        }
      }}
    >
      <Input
        aria-label="Business name"
        onChange={(e) => setBusinessName(e.target.value)}
        placeholder="Business name"
        value={businessName}
      />
      <Input
        aria-label="Contact name"
        onChange={(e) => setContactName(e.target.value)}
        placeholder="Contact name (optional)"
        value={contactName}
      />
      <Input
        aria-label="Buyer phone number"
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+91..."
        value={phone}
      />
      <Button
        disabled={addBuyer.isPending || !(businessName.trim() && phone.trim())}
        type="submit"
        variant="outline"
      >
        {addBuyer.isPending ? "Adding..." : "Add buyer"}
      </Button>
    </form>
  );
}

function NewSupplierForm({ onCreated }: { onCreated: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const createSupplier = useMutation(
    orpc.suppliers.create.mutationOptions({
      onSuccess: () => {
        setName("");
        setPhone("");
        queryClient.invalidateQueries({ queryKey: orpc.suppliers.key() });
        onCreated();
      },
    })
  );

  return (
    <form
      className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim() && phone.trim()) {
          createSupplier.mutate({ name: name.trim(), phone: phone.trim() });
        }
      }}
    >
      <div className="flex-1 space-y-1">
        <Label htmlFor="supplier-name">Supplier name</Label>
        <Input
          id="supplier-name"
          onChange={(e) => setName(e.target.value)}
          placeholder="Metro Packaging Supplies"
          value={name}
        />
      </div>
      <div className="flex-1 space-y-1">
        <Label htmlFor="supplier-phone">Phone</Label>
        <Input
          id="supplier-phone"
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91..."
          value={phone}
        />
      </div>
      <Button
        disabled={createSupplier.isPending || !(name.trim() && phone.trim())}
        type="submit"
      >
        {createSupplier.isPending ? "Creating..." : "Create supplier"}
      </Button>
    </form>
  );
}

export default function SetupView() {
  const groups = useQuery(orpc.groups.list.queryOptions());
  const suppliers = useQuery(orpc.suppliers.list.queryOptions());
  const [groupSheetOpen, setGroupSheetOpen] = useState(false);
  const [supplierSheetOpen, setSupplierSheetOpen] = useState(false);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Users className="size-5" />
            </span>
            <div>
              <CardTitle>Buying groups</CardTitle>
              <p className="mt-1 text-muted-foreground text-sm">
                {groups.data?.length ?? 0} groups in your network
              </p>
            </div>
            <Button
              className="ml-auto"
              onClick={() => setGroupSheetOpen(true)}
              size="sm"
              variant="outline"
            >
              <Plus className="size-4" />
              New
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-5">
          {groups.data?.map((group) => (
            <section
              className="space-y-3 rounded-2xl border bg-card p-4"
              key={group.id}
            >
              <div className="flex items-baseline justify-between">
                <span className="font-semibold">{group.name}</span>
                <span className="text-muted-foreground text-xs">
                  {group.buyers.length} buyer
                  {group.buyers.length === 1 ? "" : "s"}
                </span>
              </div>
              <ul className="divide-y text-sm">
                {group.buyers.map((buyer) => (
                  <li
                    className="flex items-center justify-between gap-3 py-2.5"
                    key={buyer.id}
                  >
                    <span>
                      <span className="block font-medium text-foreground">
                        {buyer.businessName}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {buyer.contactName ?? "Primary contact"}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                      <Phone className="size-3" />
                      {buyer.phone}
                    </span>
                  </li>
                ))}
              </ul>
              <AddBuyerForm groupId={group.id} />
            </section>
          ))}
          {groups.data?.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No groups yet. Create one to begin adding buyers.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </span>
            <div>
              <CardTitle>Suppliers</CardTitle>
              <p className="mt-1 text-muted-foreground text-sm">
                {suppliers.data?.length ?? 0} supplier contacts
              </p>
            </div>
            <Button
              className="ml-auto"
              onClick={() => setSupplierSheetOpen(true)}
              size="sm"
              variant="outline"
            >
              <Plus className="size-4" />
              New
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          <ul className="space-y-2 text-sm">
            {suppliers.data?.map((supplier) => (
              <li
                className="flex items-center gap-3 rounded-xl border bg-card p-3"
                key={supplier.id}
              >
                <span className="grid size-9 place-items-center rounded-xl bg-muted">
                  <Store className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {supplier.name}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {supplier.phone}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          {suppliers.data?.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No suppliers yet. Add one before starting a round.
            </p>
          )}
        </CardContent>
      </Card>
      <Sheet onOpenChange={setGroupSheetOpen} open={groupSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Create a buying group</SheetTitle>
            <SheetDescription>
              Group the buyers who regularly purchase together.
            </SheetDescription>
          </SheetHeader>
          <div className="p-4">
            <NewGroupForm onCreated={() => setGroupSheetOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
      <Sheet onOpenChange={setSupplierSheetOpen} open={supplierSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Add a supplier</SheetTitle>
            <SheetDescription>
              Save the supplier contact you’ll use for quote and reconfirmation
              calls.
            </SheetDescription>
          </SheetHeader>
          <div className="p-4">
            <NewSupplierForm onCreated={() => setSupplierSheetOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
