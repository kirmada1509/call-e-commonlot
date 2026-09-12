import { supplier } from "@krishna-starter-kit/db/schema/commonlot";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "../index";
import { requireOrganizerId } from "../lib/session";

export const suppliersRouter = {
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1), phone: z.string().min(1) }))
    .handler(async ({ context, input }) => {
      const organizerId = requireOrganizerId(context);
      const [created] = await context.db
        .insert(supplier)
        .values({ name: input.name, organizerId, phone: input.phone })
        .returning();
      return created;
    }),

  list: protectedProcedure.handler(async ({ context }) => {
    const organizerId = requireOrganizerId(context);
    return await context.db.query.supplier.findMany({
      orderBy: desc(supplier.createdAt),
      where: eq(supplier.organizerId, organizerId),
    });
  }),
};
