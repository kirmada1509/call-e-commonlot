import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import RoundDetailView from "./round-detail-view";

export default async function RoundDetailPage({
  params,
}: {
  params: Promise<{ roundId: string }>;
}) {
  const session = await authClient.getSession({
    fetchOptions: { headers: await headers(), throw: true },
  });

  if (!session?.user) {
    redirect("/login");
  }

  const { roundId } = await params;

  return (
    <div className="lg:pl-64">
      <div className="app-page">
        <RoundDetailView roundId={roundId} />
      </div>
    </div>
  );
}
