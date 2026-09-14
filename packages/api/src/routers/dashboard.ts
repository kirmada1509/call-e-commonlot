import {
  group,
  purchaseRound,
  supplier,
} from "@call-e-commonlot/db/schema/commonlot";
import { desc, eq } from "drizzle-orm";

import { protectedProcedure } from "../index";
import { requireOrganizerId } from "../lib/session";
import { buildDashboardOverview } from "../services/dashboard-overview";

export const dashboardRouter = {
  overview: protectedProcedure.handler(async ({ context }) => {
    const organizerId = requireOrganizerId(context);
    const [groups, suppliers, rounds] = await Promise.all([
      context.db.query.group.findMany({
        where: eq(group.organizerId, organizerId),
        with: { buyers: true },
      }),
      context.db.query.supplier.findMany({
        where: eq(supplier.organizerId, organizerId),
      }),
      context.db.query.purchaseRound.findMany({
        orderBy: desc(purchaseRound.updatedAt),
        where: eq(purchaseRound.organizerId, organizerId),
        with: {
          calls: true,
          group: true,
          proposals: { with: { lineItems: true } },
          supplier: true,
        },
      }),
    ]);

    return buildDashboardOverview({ groups, rounds, suppliers });
  }),
};
