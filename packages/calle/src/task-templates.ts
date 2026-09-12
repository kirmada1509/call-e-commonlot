export type BuyerCallPurpose = "buyer_intake" | "buyer_reconfirm";
export type SupplierCallPurpose = "supplier_quote" | "supplier_reconfirm";
export type CallPurpose = BuyerCallPurpose | SupplierCallPurpose;

export interface TaskTemplate {
  resultSchema: Record<string, unknown>;
  task: string;
}

export interface BuyerTaskContext {
  businessName: string;
  contactName?: string | null;
  productName: string;
  revisedAllInUnitPrice?: number;
  // Only meaningful (and expected) for "buyer_reconfirm".
  revisedQuantity?: number;
  revisedTotal?: number;
  unitLabel: string;
}

export interface SupplierTaskContext {
  combinedQtySoFar?: number;
  productName: string;
  supplierName: string;
  unitLabel: string;
}

// Buyer responses may legitimately be "unknown" rather than a number — a
// missing answer must never silently count as demand. CALL-E's result_schema
// only accepts a restricted JSON Schema subset (no oneOf/const), so each
// field is a plain string that must be either a numeral or the literal word
// "unknown"; the write-back layer parses and rejects anything else rather
// than guessing.
const participantResultSchema = {
  additionalProperties: false,
  properties: {
    maxTotal: {
      description:
        'The maximum total amount they authorize for this purchase, as a plain number (e.g. "9500"), or exactly "unknown" if they would not give a usable number.',
      type: "string",
    },
    maxUnitPrice: {
      description:
        'The maximum all-in price per unit they will pay, as a plain number (e.g. "950"), or exactly "unknown".',
      type: "string",
    },
    quantity: {
      description:
        'The number of units they want, as a plain integer (e.g. "12"), or exactly "unknown" if they would not give a usable number.',
      type: "string",
    },
  },
  required: ["quantity", "maxUnitPrice", "maxTotal"],
  type: "object",
} as const;

const supplierResultSchema = {
  additionalProperties: false,
  properties: {
    collectionWindow: {
      description:
        "Collection or delivery window, if stated, otherwise the empty string.",
      type: "string",
    },
    conditions: {
      description:
        "Any other conditions the supplier mentioned, otherwise the empty string.",
      type: "string",
    },
    tiers: {
      description:
        "Quantity-triggered price tiers: the minimum combined quantity to unlock each price, and the price per unit at that tier.",
      items: {
        additionalProperties: false,
        properties: {
          minQty: { minimum: 0, type: "integer" },
          pricePerUnit: { exclusiveMinimum: 0, type: "number" },
        },
        required: ["minQty", "pricePerUnit"],
        type: "object",
      },
      minItems: 1,
      type: "array",
    },
  },
  required: ["tiers"],
  type: "object",
} as const;

export function buildBuyerTaskTemplate(
  purpose: BuyerCallPurpose,
  ctx: BuyerTaskContext
): TaskTemplate {
  const who = ctx.contactName
    ? `${ctx.contactName} at ${ctx.businessName}`
    : ctx.businessName;

  const task =
    purpose === "buyer_intake"
      ? `Call ${who} about a shared group purchase of ${ctx.productName}. Ask: (1) how many ${ctx.unitLabel}s they want as part of this group order, (2) the maximum all-in price per ${ctx.unitLabel} they would pay, and (3) the maximum total amount they authorize for this purchase. If they won't give a clear number for any of these, record "unknown" for that field rather than guessing.`
      : `Call ${who} about their group purchase of ${ctx.productName}. Their order changed: it would now be ${ctx.revisedQuantity} ${ctx.unitLabel}s at ₹${ctx.revisedAllInUnitPrice} per ${ctx.unitLabel}, a total of ₹${ctx.revisedTotal}. Ask them to state their current quantity, maximum all-in price per ${ctx.unitLabel}, and maximum total so this can be reconfirmed — do not assume their earlier numbers still apply. If they won't give a clear answer, record "unknown".`;

  return { resultSchema: participantResultSchema, task };
}

export function buildSupplierTaskTemplate(
  purpose: SupplierCallPurpose,
  ctx: SupplierTaskContext
): TaskTemplate {
  const combinedQtyNote =
    ctx.combinedQtySoFar === undefined
      ? ""
      : ` The current combined interest from buyers is about ${ctx.combinedQtySoFar} ${ctx.unitLabel}s.`;

  const task =
    purpose === "supplier_quote"
      ? `Call ${ctx.supplierName} and ask for their tiered pricing for ${ctx.productName} (priced per ${ctx.unitLabel}): the minimum combined quantity needed to unlock each price tier, and the price per ${ctx.unitLabel} at each tier. Also ask about their collection or delivery terms and any other conditions for a single consolidated order.${combinedQtyNote}`
      : `Call ${ctx.supplierName} to reconfirm whether their previously quoted tiered pricing for ${ctx.productName} (per ${ctx.unitLabel}) still holds.${combinedQtyNote} Ask them to restate their current tier pricing, collection/delivery terms, and any conditions — do not assume the previously quoted terms are still valid.`;

  return { resultSchema: supplierResultSchema, task };
}
