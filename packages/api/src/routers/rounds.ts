import {
  call,
  group,
  orderStatusEvent,
  participantRequest,
  proposal,
  proposalLineItem,
  purchaseRound,
  supplier,
  supplierOffer,
} from "@call-e-commonlot/db/schema/commonlot";
import { ORPCError } from "@orpc/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "../index";
import {
  assertGroupOwnership,
  assertRoundOwnership,
  assertSupplierOwnership,
} from "../lib/ownership";
import { requireOrganizerId } from "../lib/session";
import {
  reconcilePendingCalls,
  triggerBuyerCall,
  triggerSupplierCall,
} from "../services/calle-integration";
import {
  confirmProposalLineItem,
  submitParticipantRequest,
  submitSupplierOffer,
} from "../services/proposal-engine";

const tierInput = z.object({
  minQty: z.number().int().nonnegative(),
  pricePerUnit: z.number().positive(),
});

const simulatedResultInput = z.record(z.string(), z.unknown()).optional();

const orderStatusValues = [
  "proposal_ready",
  "organizer_approved",
  "order_placed",
  "goods_received",
] as const;

export const roundsRouter = {
  confirmLineItem: protectedProcedure
    .input(z.object({ lineItemId: z.string() }))
    .handler(async ({ context, input }) => {
      const organizerId = requireOrganizerId(context);
      const item = await context.db.query.proposalLineItem.findFirst({
        where: eq(proposalLineItem.id, input.lineItemId),
        with: { proposal: true },
      });
      if (!item) {
        throw new ORPCError("NOT_FOUND");
      }
      await assertRoundOwnership(
        context.db,
        item.proposal.roundId,
        organizerId
      );
      return await confirmProposalLineItem(context.db, input.lineItemId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        baselineUnitPrice: z.number().nonnegative().optional(),
        groupId: z.string(),
        handlingFeePerUnit: z.number().nonnegative().default(0),
        productName: z.string().min(1),
        supplierId: z.string(),
        unitLabel: z.string().min(1).default("carton"),
      })
    )
    .handler(async ({ context, input }) => {
      const organizerId = requireOrganizerId(context);
      await assertGroupOwnership(context.db, input.groupId, organizerId);
      await assertSupplierOwnership(context.db, input.supplierId, organizerId);

      const [created] = await context.db
        .insert(purchaseRound)
        .values({
          baselineUnitPrice: input.baselineUnitPrice?.toString() ?? null,
          groupId: input.groupId,
          handlingFeePerUnit: input.handlingFeePerUnit.toString(),
          organizerId,
          productName: input.productName,
          status: "active",
          supplierId: input.supplierId,
          unitLabel: input.unitLabel,
        })
        .returning();
      return created;
    }),

  get: protectedProcedure
    .input(z.object({ roundId: z.string() }))
    .handler(async ({ context, input }) => {
      const organizerId = requireOrganizerId(context);
      const round = await assertRoundOwnership(
        context.db,
        input.roundId,
        organizerId
      );

      await reconcilePendingCalls(context.db, context.calle, round.id);

      const [
        roundGroup,
        roundSupplier,
        requests,
        offer,
        latestProposal,
        calls,
        orderEvents,
      ] = await Promise.all([
        context.db.query.group.findFirst({
          where: eq(group.id, round.groupId),
          with: { buyers: true },
        }),
        context.db.query.supplier.findFirst({
          where: eq(supplier.id, round.supplierId),
        }),
        context.db.query.participantRequest.findMany({
          where: and(
            eq(participantRequest.roundId, round.id),
            isNull(participantRequest.supersededAt)
          ),
        }),
        context.db.query.supplierOffer.findFirst({
          orderBy: desc(supplierOffer.createdAt),
          where: and(
            eq(supplierOffer.roundId, round.id),
            isNull(supplierOffer.supersededAt)
          ),
        }),
        context.db.query.proposal.findFirst({
          orderBy: desc(proposal.version),
          where: eq(proposal.roundId, round.id),
          with: { lineItems: true },
        }),
        context.db.query.call.findMany({
          orderBy: desc(call.createdAt),
          where: eq(call.roundId, round.id),
        }),
        context.db.query.orderStatusEvent.findMany({
          orderBy: desc(orderStatusEvent.createdAt),
          where: eq(orderStatusEvent.roundId, round.id),
        }),
      ]);

      return {
        calls,
        group: roundGroup,
        offer: offer ?? null,
        orderEvents,
        proposal: latestProposal ?? null,
        requests,
        round,
        supplier: roundSupplier,
      };
    }),

  list: protectedProcedure.handler(async ({ context }) => {
    const organizerId = requireOrganizerId(context);
    return await context.db.query.purchaseRound.findMany({
      orderBy: desc(purchaseRound.createdAt),
      where: eq(purchaseRound.organizerId, organizerId),
    });
  }),

  recordOrderStatus: protectedProcedure
    .input(
      z.object({
        note: z.string().optional(),
        roundId: z.string(),
        status: z.enum(orderStatusValues),
      })
    )
    .handler(async ({ context, input }) => {
      const organizerId = requireOrganizerId(context);
      await assertRoundOwnership(context.db, input.roundId, organizerId);
      const [created] = await context.db
        .insert(orderStatusEvent)
        .values({
          createdByUserId: organizerId,
          note: input.note ?? null,
          roundId: input.roundId,
          status: input.status,
        })
        .returning();
      return created;
    }),

  submitParticipantRequest: protectedProcedure
    .input(
      z.object({
        buyerId: z.string(),
        maxTotal: z.number().positive(),
        maxUnitPrice: z.number().positive(),
        quantity: z.number().int().positive(),
        roundId: z.string(),
      })
    )
    .handler(async ({ context, input }) => {
      const organizerId = requireOrganizerId(context);
      await assertRoundOwnership(context.db, input.roundId, organizerId);
      return await submitParticipantRequest(context.db, {
        ...input,
        source: "manual",
      });
    }),

  submitSupplierOffer: protectedProcedure
    .input(
      z.object({
        collectionWindow: z.string().optional(),
        conditions: z.string().optional(),
        roundId: z.string(),
        tiers: z.array(tierInput).min(1),
      })
    )
    .handler(async ({ context, input }) => {
      const organizerId = requireOrganizerId(context);
      await assertRoundOwnership(context.db, input.roundId, organizerId);
      return await submitSupplierOffer(context.db, {
        ...input,
        source: "manual",
      });
    }),

  triggerBuyerCall: protectedProcedure
    .input(
      z.object({
        buyerId: z.string(),
        dryRun: z.boolean().default(false),
        purpose: z.enum(["buyer_intake", "buyer_reconfirm"]),
        roundId: z.string(),
        simulatedResult: simulatedResultInput,
      })
    )
    .handler(async ({ context, input }) => {
      const organizerId = requireOrganizerId(context);
      await assertRoundOwnership(context.db, input.roundId, organizerId);
      return await triggerBuyerCall(context.db, context.calle, input);
    }),

  triggerSupplierCall: protectedProcedure
    .input(
      z.object({
        dryRun: z.boolean().default(false),
        purpose: z.enum(["supplier_quote", "supplier_reconfirm"]),
        roundId: z.string(),
        simulatedResult: simulatedResultInput,
      })
    )
    .handler(async ({ context, input }) => {
      const organizerId = requireOrganizerId(context);
      await assertRoundOwnership(context.db, input.roundId, organizerId);
      return await triggerSupplierCall(context.db, context.calle, input);
    }),
};
