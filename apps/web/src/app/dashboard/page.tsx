import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import Dashboard from "./dashboard";

export default async function DashboardPage() {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
      throw: true,
    },
  });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="lg:pl-64">
      <div className="app-page">
        <div className="mb-8">
          <p className="font-medium text-primary text-sm">Overview</p>
          <h1 className="mt-1 font-semibold text-3xl tracking-tight">
            Good to see you, {session.user.name.split(" ")[0]}.
          </h1>
          <p className="mt-2 text-muted-foreground">
            Here’s what needs your attention across the network.
          </p>
        </div>
        <Dashboard />
      </div>
    </div>
  );
}
