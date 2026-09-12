import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const requestSourceEnum = pgEnum("request_source", ["call", "manual"]);
export const callPurposeEnum = pgEnum("call_purpose", [
  "buyer_intake",
  "buyer_reconfirm",
  "supplier_quote",
  "supplier_reconfirm",
]);
export const callTargetTypeEnum = pgEnum("call_target_type", [
  "buyer",
  "supplier",
]);
export const callModeEnum = pgEnum("call_mode", ["real", "simulated"]);
export const callStatusEnum = pgEnum("call_status", [
  "queued",
  "in_progress",
  "completed",
  "failed",
  "canceled",
]);
export const purchaseRoundStatusEnum = pgEnum("purchase_round_status", [
  "draft",
  "active",
  "archived",
]);
export const proposalStatusEnum = pgEnum("proposal_status", [
  "infeasible",
  "feasible_unconfirmed",
  "ready_for_review",
  "superseded",
]);
export const orderStatusEnum = pgEnum("order_status", [
  "proposal_ready",
  "organizer_approved",
  "order_placed",
  "goods_received",
]);

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

export const group = pgTable(
  "commonlot_group",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    id: id(),
    name: text("name").notNull(),
    organizerId: text("organizer_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("commonlot_group_organizer_idx").on(table.organizerId)]
);

export const buyer = pgTable(
  "commonlot_buyer",
  {
    businessName: text("business_name").notNull(),
    contactName: text("contact_name"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    groupId: text("group_id")
      .notNull()
      .references(() => group.id, { onDelete: "cascade" }),
    id: id(),
    phone: text("phone").notNull(),
  },
  (table) => [index("commonlot_buyer_group_idx").on(table.groupId)]
);

export const supplier = pgTable(
  "commonlot_supplier",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    id: id(),
    name: text("name").notNull(),
    organizerId: text("organizer_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    phone: text("phone").notNull(),
  },
  (table) => [index("commonlot_supplier_organizer_idx").on(table.organizerId)]
);

export const purchaseRound = pgTable(
  "commonlot_purchase_round",
  {
    baselineUnitPrice: numeric("baseline_unit_price", {
      precision: 12,
      scale: 2,
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    groupId: text("group_id")
      .notNull()
      .references(() => group.id, { onDelete: "cascade" }),
    handlingFeePerUnit: numeric("handling_fee_per_unit", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),
    id: id(),
    organizerId: text("organizer_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    productName: text("product_name").notNull(),
    status: purchaseRoundStatusEnum("status").notNull().default("draft"),
    supplierId: text("supplier_id")
      .notNull()
      .references(() => supplier.id, { onDelete: "cascade" }),
    unitLabel: text("unit_label").notNull().default("carton"),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("commonlot_round_organizer_idx").on(table.organizerId),
    index("commonlot_round_group_idx").on(table.groupId),
    index("commonlot_round_supplier_idx").on(table.supplierId),
  ]
);

export const call = pgTable(
  "commonlot_call",
  {
    calleCallId: text("calle_call_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    errorMessage: text("error_message"),
    id: id(),
    mode: callModeEnum("mode").notNull().default("real"),
    purpose: callPurposeEnum("purpose").notNull(),
    resultSchema: jsonb("result_schema"),
    roundId: text("round_id")
      .notNull()
      .references(() => purchaseRound.id, { onDelete: "cascade" }),
    status: callStatusEnum("status").notNull().default("queued"),
    structuredResult: jsonb("structured_result"),
    targetId: text("target_id").notNull(),
    targetType: callTargetTypeEnum("target_type").notNull(),
    task: text("task").notNull(),
    transcript: jsonb("transcript"),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("commonlot_call_round_idx").on(table.roundId),
    index("commonlot_call_target_idx").on(table.targetType, table.targetId),
  ]
);

export const participantRequest = pgTable(
  "commonlot_participant_request",
  {
    buyerId: text("buyer_id")
      .notNull()
      .references(() => buyer.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    id: id(),
    maxTotal: numeric("max_total", { precision: 12, scale: 2 }).notNull(),
    maxUnitPrice: numeric("max_unit_price", {
      precision: 12,
      scale: 2,
    }).notNull(),
    quantity: integer("quantity").notNull(),
    roundId: text("round_id")
      .notNull()
      .references(() => purchaseRound.id, { onDelete: "cascade" }),
    source: requestSourceEnum("source").notNull(),
    sourceCallId: text("source_call_id").references(() => call.id, {
      onDelete: "set null",
    }),
    supersededAt: timestamp("superseded_at"),
    version: integer("version").notNull().default(1),
  },
  (table) => [
    index("commonlot_request_round_idx").on(table.roundId),
    index("commonlot_request_buyer_idx").on(table.buyerId),
  ]
);

export const supplierOffer = pgTable(
  "commonlot_supplier_offer",
  {
    collectionWindow: text("collection_window"),
    conditions: text("conditions"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    id: id(),
    roundId: text("round_id")
      .notNull()
      .references(() => purchaseRound.id, { onDelete: "cascade" }),
    source: requestSourceEnum("source").notNull(),
    sourceCallId: text("source_call_id").references(() => call.id, {
      onDelete: "set null",
    }),
    supersededAt: timestamp("superseded_at"),
    tiers: jsonb("tiers")
      .$type<Array<{ minQty: number; pricePerUnit: number }>>()
      .notNull(),
    version: integer("version").notNull().default(1),
  },
  (table) => [index("commonlot_offer_round_idx").on(table.roundId)]
);

export const proposal = pgTable(
  "commonlot_proposal",
  {
    allInUnitPrice: numeric("all_in_unit_price", { precision: 12, scale: 2 }),
    baselineComparisonTotal: numeric("baseline_comparison_total", {
      precision: 12,
      scale: 2,
    }),
    combinedQty: integer("combined_qty").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    feasible: boolean("feasible").notNull(),
    id: id(),
    roundId: text("round_id")
      .notNull()
      .references(() => purchaseRound.id, { onDelete: "cascade" }),
    savings: numeric("savings", { precision: 12, scale: 2 }),
    shortfall: integer("shortfall"),
    status: proposalStatusEnum("status").notNull(),
    tierMinQty: integer("tier_min_qty"),
    totalCost: numeric("total_cost", { precision: 12, scale: 2 }),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }),
    version: integer("version").notNull(),
  },
  (table) => [
    index("commonlot_proposal_round_idx").on(table.roundId),
    index("commonlot_proposal_status_idx").on(table.status),
  ]
);

export const proposalLineItem = pgTable(
  "commonlot_proposal_line_item",
  {
    allInUnitPrice: numeric("all_in_unit_price", {
      precision: 12,
      scale: 2,
    }).notNull(),
    buyerId: text("buyer_id")
      .notNull()
      .references(() => buyer.id, { onDelete: "cascade" }),
    confirmed: boolean("confirmed").notNull().default(false),
    confirmedAt: timestamp("confirmed_at"),
    confirmedByCallId: text("confirmed_by_call_id").references(() => call.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    id: id(),
    participantRequestId: text("participant_request_id")
      .notNull()
      .references(() => participantRequest.id, { onDelete: "cascade" }),
    proposalId: text("proposal_id")
      .notNull()
      .references(() => proposal.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    requiresReconfirmation: boolean("requires_reconfirmation")
      .notNull()
      .default(false),
    totalCost: numeric("total_cost", {
      precision: 12,
      scale: 2,
    }).notNull(),
    withinCap: boolean("within_cap").notNull().default(true),
  },
  (table) => [
    index("commonlot_line_item_proposal_idx").on(table.proposalId),
    index("commonlot_line_item_buyer_idx").on(table.buyerId),
  ]
);

export const orderStatusEvent = pgTable(
  "commonlot_order_status_event",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    id: id(),
    note: text("note"),
    roundId: text("round_id")
      .notNull()
      .references(() => purchaseRound.id, { onDelete: "cascade" }),
    status: orderStatusEnum("status").notNull(),
  },
  (table) => [index("commonlot_order_event_round_idx").on(table.roundId)]
);

export const groupRelations = relations(group, ({ many }) => ({
  buyers: many(buyer),
  rounds: many(purchaseRound),
}));

export const buyerRelations = relations(buyer, ({ one, many }) => ({
  group: one(group, { fields: [buyer.groupId], references: [group.id] }),
  requests: many(participantRequest),
}));

export const supplierRelations = relations(supplier, ({ many }) => ({
  rounds: many(purchaseRound),
}));

export const purchaseRoundRelations = relations(
  purchaseRound,
  ({ one, many }) => ({
    calls: many(call),
    group: one(group, {
      fields: [purchaseRound.groupId],
      references: [group.id],
    }),
    orderStatusEvents: many(orderStatusEvent),
    participantRequests: many(participantRequest),
    proposals: many(proposal),
    supplier: one(supplier, {
      fields: [purchaseRound.supplierId],
      references: [supplier.id],
    }),
    supplierOffers: many(supplierOffer),
  })
);

export const callRelations = relations(call, ({ one }) => ({
  round: one(purchaseRound, {
    fields: [call.roundId],
    references: [purchaseRound.id],
  }),
}));

export const participantRequestRelations = relations(
  participantRequest,
  ({ one }) => ({
    buyer: one(buyer, {
      fields: [participantRequest.buyerId],
      references: [buyer.id],
    }),
    round: one(purchaseRound, {
      fields: [participantRequest.roundId],
      references: [purchaseRound.id],
    }),
    sourceCall: one(call, {
      fields: [participantRequest.sourceCallId],
      references: [call.id],
    }),
  })
);

export const supplierOfferRelations = relations(supplierOffer, ({ one }) => ({
  round: one(purchaseRound, {
    fields: [supplierOffer.roundId],
    references: [purchaseRound.id],
  }),
  sourceCall: one(call, {
    fields: [supplierOffer.sourceCallId],
    references: [call.id],
  }),
}));

export const proposalRelations = relations(proposal, ({ one, many }) => ({
  lineItems: many(proposalLineItem),
  round: one(purchaseRound, {
    fields: [proposal.roundId],
    references: [purchaseRound.id],
  }),
}));

export const proposalLineItemRelations = relations(
  proposalLineItem,
  ({ one }) => ({
    buyer: one(buyer, {
      fields: [proposalLineItem.buyerId],
      references: [buyer.id],
    }),
    participantRequest: one(participantRequest, {
      fields: [proposalLineItem.participantRequestId],
      references: [participantRequest.id],
    }),
    proposal: one(proposal, {
      fields: [proposalLineItem.proposalId],
      references: [proposal.id],
    }),
  })
);

export const orderStatusEventRelations = relations(
  orderStatusEvent,
  ({ one }) => ({
    createdBy: one(user, {
      fields: [orderStatusEvent.createdByUserId],
      references: [user.id],
    }),
    round: one(purchaseRound, {
      fields: [orderStatusEvent.roundId],
      references: [purchaseRound.id],
    }),
  })
);
