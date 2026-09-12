import { ORPCError } from "@orpc/server";

import type { Context } from "../context";

export function requireOrganizerId(context: Context): string {
  const userId = context.session?.user?.id;
  if (!userId) {
    throw new ORPCError("UNAUTHORIZED");
  }
  return userId;
}
