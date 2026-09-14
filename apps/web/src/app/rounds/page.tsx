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
    <div className="lg:pl-64">
      <div className="app-page">
        <RoundsView />
      </div>
    </div>
  );
}
