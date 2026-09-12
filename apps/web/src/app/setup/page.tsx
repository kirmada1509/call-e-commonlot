import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import SetupView from "./setup-view";

export default async function SetupPage() {
  const session = await authClient.getSession({
    fetchOptions: { headers: await headers(), throw: true },
  });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-1 font-semibold text-xl">Groups &amp; suppliers</h1>
      <p className="mb-6 text-muted-foreground text-sm">
        Set up the buying group and the supplier before starting a purchase
        round.
      </p>
      <SetupView />
    </div>
  );
}
