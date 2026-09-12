import "varlock/auto-load";

import { and, eq } from "drizzle-orm";

import { createDb } from "./index";
import { buyer, group, purchaseRound, supplier, user } from "./schema";

const DEMO_GROUP_NAME = "Local Bag Co-op";
const DEMO_SUPPLIER_NAME = "Metro Packaging Supplies";

/**
 * Resets and reseeds the entities for the research doc's worked example:
 * three buyers (12/10/8 cartons requested, ₹950 all-in ceiling each) and a
 * supplier that offers ₹900/carton at a 30-carton threshold, ₹50/carton
 * handling fee, ₹1,200/carton baseline for the savings comparison.
 *
 * Deliberately does NOT pre-populate participant requests or the supplier
 * offer — those are meant to come from calls (dry-run or real) placed
 * through the app, per DEMO_SCRIPT.md, so the demo shows the proposal
 * actually being assembled from call results rather than starting
 * pre-filled. Re-running this script wipes any prior demo group/supplier
 * for the organizer first, so it's safe to use as a "reset before
 * recording" step.
 *
 * Attaches the demo data to an already-registered organizer (sign up via
 * the web app first) so it shows up on login.
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

await db
  .delete(group)
  .where(
    and(eq(group.organizerId, organizer.id), eq(group.name, DEMO_GROUP_NAME))
  );
await db
  .delete(supplier)
  .where(
    and(
      eq(supplier.organizerId, organizer.id),
      eq(supplier.name, DEMO_SUPPLIER_NAME)
    )
  );

const [demoGroup] = await db
  .insert(group)
  .values({ name: DEMO_GROUP_NAME, organizerId: organizer.id })
  .returning();
if (!demoGroup) {
  throw new Error("Failed to insert demo group");
}

const [demoSupplier] = await db
  .insert(supplier)
  .values({
    name: DEMO_SUPPLIER_NAME,
    organizerId: organizer.id,
    phone: "+910000000000",
  })
  .returning();
if (!demoSupplier) {
  throw new Error("Failed to insert demo supplier");
}

const buyerSeeds = [
  { businessName: "Business A", phone: "+910000000001" },
  { businessName: "Business B", phone: "+910000000002" },
  { businessName: "Business C", phone: "+910000000003" },
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

console.log(
  `Reset and seeded round "${round.productName}" (${round.id}) for organizer ${organizerEmail} with ${insertedBuyers.length} buyers and 1 supplier — no requests/offer yet. Follow DEMO_SCRIPT.md from here.`
);
