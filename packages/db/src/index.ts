import { drizzle } from "drizzle-orm/node-postgres";

import type { DatabaseConfig } from "./config";
import {
  account,
  accountRelations,
  buyer,
  buyerRelations,
  call,
  callRelations,
  group,
  groupRelations,
  orderStatusEvent,
  orderStatusEventRelations,
  participantRequest,
  participantRequestRelations,
  proposal,
  proposalLineItem,
  proposalLineItemRelations,
  proposalRelations,
  purchaseRound,
  purchaseRoundRelations,
  session,
  sessionRelations,
  supplier,
  supplierOffer,
  supplierOfferRelations,
  supplierRelations,
  user,
  userRelations,
  verification,
} from "./schema";

const schema = {
  account,
  accountRelations,
  buyer,
  buyerRelations,
  call,
  callRelations,
  group,
  groupRelations,
  orderStatusEvent,
  orderStatusEventRelations,
  participantRequest,
  participantRequestRelations,
  proposal,
  proposalLineItem,
  proposalLineItemRelations,
  proposalRelations,
  purchaseRound,
  purchaseRoundRelations,
  session,
  sessionRelations,
  supplier,
  supplierOffer,
  supplierOfferRelations,
  supplierRelations,
  user,
  userRelations,
  verification,
};

export function createDb(env: DatabaseConfig) {
  return drizzle(env.DATABASE_URL, { schema });
}

export type Database = ReturnType<typeof createDb>;
