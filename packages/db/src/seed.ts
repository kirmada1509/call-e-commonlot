import "varlock/auto-load";

import { eq } from "drizzle-orm";

import { createDb } from "./index";
import { buyer, group, purchaseRound, supplier, user } from "./schema";
import { participantRequest, supplierOffer } from "./schema/commonlot";

/**
 * Seeds the exact worked example from call-e-commonlot-research.md: three
 * buyers requesting 12/10/8 cartons at a ₹950 all-in ceiling, and a supplier
 * offering ₹900/carton at a 30-carton threshold plus a ₹50 handling fee.
 * Attaches the demo data to an already-registered organizer (sign up via the
 * web app first) so it shows up on login.
 *
 * Usage: bun run src/seed.ts <organizer-email>
 */

const organizerEmail = process.argv[2] ?? "organizer@commonlot.test";
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Run this from a shell where apps/server/.env has been loaded, e.g.:\n" +
      "  cd packages/db && bun run db:seed"
  );
}

const db = createDb({ DATABASE_URL: databaseUrl });

const [organizer] = await db
  .select()
  .from(user)
  .where(eq(user.email, organizerEmail))
  .limit(1);

if (!organizer) {
  throw new Error(
    `No user with email "${organizerEmail}" found. Sign up through the web app first, then re-run: bun run src/seed.ts ${organizerEmail}`
  );
}

const [demoGroup] = await db
  .insert(group)
  .values({ name: "Local Bag Co-op", organizerId: organizer.id })
  .returning();
if (!demoGroup) {
  throw new Error("Failed to insert demo group");
}

const [demoSupplier] = await db
  .insert(supplier)
  .values({
    name: "Metro Packaging Supplies",
    organizerId: organizer.id,
    phone: "+910000000000",
  })
  .returning();
if (!demoSupplier) {
  throw new Error("Failed to insert demo supplier");
}

const buyerSeeds = [
  { businessName: "Business A", phone: "+910000000001", quantity: 12 },
  { businessName: "Business B", phone: "+910000000002", quantity: 10 },
  { businessName: "Business C", phone: "+910000000003", quantity: 8 },
];

const insertedBuyers = await db
  .insert(buyer)
  .values(
    buyerSeeds.map((b) => ({
      businessName: b.businessName,
      groupId: demoGroup.id,
      phone: b.phone,
    }))
  )
  .returning();

const [round] = await db
  .insert(purchaseRound)
  .values({
    baselineUnitPrice: "1200",
    groupId: demoGroup.id,
    handlingFeePerUnit: "50",
    organizerId: organizer.id,
    productName: "Unbranded takeaway bags (carton of 500)",
    status: "active",
    supplierId: demoSupplier.id,
    unitLabel: "carton",
  })
  .returning();
if (!round) {
  throw new Error("Failed to insert demo round");
}

await db.insert(participantRequest).values(
  insertedBuyers.map((b, i) => {
    const seed = buyerSeeds[i];
    if (!seed) {
      throw new Error(`Missing seed data for inserted buyer ${b.id}`);
    }
    return {
      buyerId: b.id,
      maxTotal: (seed.quantity * 950).toString(),
      maxUnitPrice: "950",
      quantity: seed.quantity,
      roundId: round.id,
      source: "manual" as const,
    };
  })
);

await db.insert(supplierOffer).values({
  collectionWindow: "Weekday pickup, organizer's warehouse",
  conditions: "One invoice to the organizer; single collection point",
  roundId: round.id,
  source: "manual",
  tiers: [
    { minQty: 0, pricePerUnit: 1050 },
    { minQty: 30, pricePerUnit: 900 },
  ],
});

console.log(
  `Seeded round "${round.productName}" (${round.id}) for organizer ${organizerEmail} with ${insertedBuyers.length} buyers and 1 supplier offer.`
);
