import type { Database } from "@call-e-commonlot/db";
import {
  group,
  purchaseRound,
  supplier,
} from "@call-e-commonlot/db/schema/commonlot";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";

export async function assertGroupOwnership(
  db: Database,
  groupId: string,
  organizerId: string
) {
  const row = await db.query.group.findFirst({
    where: eq(group.id, groupId),
  });
  if (!row || row.organizerId !== organizerId) {
    throw new ORPCError("NOT_FOUND");
  }
  return row;
}

export async function assertSupplierOwnership(
  db: Database,
  supplierId: string,
  organizerId: string
) {
  const row = await db.query.supplier.findFirst({
    where: eq(supplier.id, supplierId),
  });
  if (!row || row.organizerId !== organizerId) {
    throw new ORPCError("NOT_FOUND");
  }
  return row;
}

export async function assertRoundOwnership(
  db: Database,
  roundId: string,
  organizerId: string
) {
  const row = await db.query.purchaseRound.findFirst({
    where: eq(purchaseRound.id, roundId),
  });
  if (!row || row.organizerId !== organizerId) {
    throw new ORPCError("NOT_FOUND");
  }
  return row;
}
