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
    <div className="lg:pl-64">
      <div className="app-page">
        <div className="mb-8">
          <p className="font-medium text-primary text-sm">Relationships</p>
          <h1 className="mt-1 font-semibold text-3xl tracking-tight">
            Network
          </h1>
          <p className="mt-2 text-muted-foreground">
            Keep the people and suppliers behind every pooled purchase close at
            hand.
          </p>
        </div>
        <SetupView />
      </div>
    </div>
  );
}
