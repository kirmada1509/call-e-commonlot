import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import RoundsView from "./rounds-view";

export default async function RoundsPage() {
  const session = await authClient.getSession({
    fetchOptions: { headers: await headers(), throw: true },
  });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-1 font-semibold text-xl">Purchase rounds</h1>
      <p className="mb-6 text-muted-foreground text-sm">
        Each round is one shared purchase: a group of buyers, a supplier, and
        the proposal CommonLot assembles from their answers.
      </p>
      <RoundsView />
    </div>
  );
}
