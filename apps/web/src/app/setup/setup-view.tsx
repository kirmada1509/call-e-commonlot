"use client";

import { Button } from "@krishna-starter-kit/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@krishna-starter-kit/ui/components/card";
import { Input } from "@krishna-starter-kit/ui/components/input";
import { Label } from "@krishna-starter-kit/ui/components/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { orpc } from "@/utils/orpc";

function NewGroupForm() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const createGroup = useMutation(
    orpc.groups.create.mutationOptions({
      onSuccess: () => {
        setName("");
        queryClient.invalidateQueries({ queryKey: orpc.groups.key() });
      },
    })
  );

  return (
    <form
      className="flex items-end gap-2"
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
        onChange={(e) => setBusinessName(e.target.value)}
        placeholder="Business name"
        value={businessName}
      />
      <Input
        onChange={(e) => setContactName(e.target.value)}
        placeholder="Contact name (optional)"
        value={contactName}
      />
      <Input
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

function NewSupplierForm() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const createSupplier = useMutation(
    orpc.suppliers.create.mutationOptions({
      onSuccess: () => {
        setName("");
        setPhone("");
        queryClient.invalidateQueries({ queryKey: orpc.suppliers.key() });
      },
    })
  );

  return (
    <form
      className="flex items-end gap-2"
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

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Groups</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <NewGroupForm />
          {groups.data?.map((group) => (
            <div className="space-y-2 border-t pt-3" key={group.id}>
              <div className="flex items-baseline justify-between">
                <span className="font-medium">{group.name}</span>
                <span className="text-muted-foreground text-xs">
                  {group.buyers.length} buyer
                  {group.buyers.length === 1 ? "" : "s"}
                </span>
              </div>
              <ul className="space-y-1 text-sm">
                {group.buyers.map((buyer) => (
                  <li className="text-muted-foreground" key={buyer.id}>
                    {buyer.businessName}
                    {buyer.contactName ? ` — ${buyer.contactName}` : ""} (
                    {buyer.phone})
                  </li>
                ))}
              </ul>
              <AddBuyerForm groupId={group.id} />
            </div>
          ))}
          {groups.data?.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No groups yet — create one above.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suppliers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <NewSupplierForm />
          <ul className="space-y-1 text-sm">
            {suppliers.data?.map((supplier) => (
              <li key={supplier.id}>
                {supplier.name} ({supplier.phone})
              </li>
            ))}
          </ul>
          {suppliers.data?.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No suppliers yet — create one above.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
