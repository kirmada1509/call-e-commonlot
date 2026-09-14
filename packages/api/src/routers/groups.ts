import { buyer, group } from "@call-e-commonlot/db/schema/commonlot";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../index";
import { assertGroupOwnership } from "../lib/ownership";
import { requireOrganizerId } from "../lib/session";

export const groupsRouter = {
  addBuyer: protectedProcedure
    .input(
      z.object({
        businessName: z.string().min(1),
        contactName: z.string().optional(),
        groupId: z.string(),
        phone: z.string().min(1),
      })
    )
    .handler(async ({ context, input }) => {
      const organizerId = requireOrganizerId(context);
      await assertGroupOwnership(context.db, input.groupId, organizerId);

      const [created] = await context.db
        .insert(buyer)
        .values({
          businessName: input.businessName,
          contactName: input.contactName ?? null,
          groupId: input.groupId,
          phone: input.phone,
        })
        .returning();
      return created;
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .handler(async ({ context, input }) => {
      const organizerId = requireOrganizerId(context);
      const [created] = await context.db
        .insert(group)
        .values({ name: input.name, organizerId })
        .returning();
      return created;
    }),

  list: protectedProcedure.handler(async ({ context }) => {
    const organizerId = requireOrganizerId(context);
    return await context.db.query.group.findMany({
      orderBy: desc(group.createdAt),
      where: eq(group.organizerId, organizerId),
      with: { buyers: true },
    });
  }),
};
