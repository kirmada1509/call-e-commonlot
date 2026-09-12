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
    <div className="mx-auto max-w-4xl px-4 py-6">
      <RoundDetailView roundId={roundId} />
    </div>
  );
}
