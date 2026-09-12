import { describe, expect, test } from "bun:test";

import {
  buildBuyerTaskTemplate,
  buildSupplierTaskTemplate,
} from "./task-templates";

describe("buildBuyerTaskTemplate", () => {
  test("buyer_intake asks for quantity, unit price, and total", () => {
    const { task, resultSchema } = buildBuyerTaskTemplate("buyer_intake", {
      businessName: "Business A",
      contactName: "Asha",
      productName: "Unbranded takeaway bags",
      unitLabel: "carton",
    });

    expect(task).toContain("Asha at Business A");
    expect(task).toContain("Unbranded takeaway bags");
    expect(task).toContain("unknown");
    expect(resultSchema).toMatchObject({
      required: ["quantity", "maxUnitPrice", "maxTotal"],
      type: "object",
    });
  });

  test("buyer_reconfirm references the revised total", () => {
    const { task } = buildBuyerTaskTemplate("buyer_reconfirm", {
      businessName: "Business A",
      productName: "Unbranded takeaway bags",
      revisedAllInUnitPrice: 950,
      revisedQuantity: 14,
      revisedTotal: 13_300,
      unitLabel: "carton",
    });

    expect(task).toContain("14 cartons");
    expect(task).toContain("13300");
    expect(task).not.toContain("undefined");
  });

  test("result_schema avoids oneOf/const (CALL-E rejects those keywords)", () => {
    const { resultSchema } = buildBuyerTaskTemplate("buyer_intake", {
      businessName: "Business A",
      productName: "bags",
      unitLabel: "carton",
    });
    const serialized = JSON.stringify(resultSchema);
    expect(serialized).not.toContain("oneOf");
    expect(serialized).not.toContain('"const"');
  });
});

describe("buildSupplierTaskTemplate", () => {
  test("supplier_quote asks for tiers and mentions combined quantity", () => {
    const { task, resultSchema } = buildSupplierTaskTemplate("supplier_quote", {
      combinedQtySoFar: 30,
      productName: "Unbranded takeaway bags",
      supplierName: "Metro Packaging",
      unitLabel: "carton",
    });

    expect(task).toContain("Metro Packaging");
    expect(task).toContain("30 cartons");
    expect(resultSchema).toMatchObject({ required: ["tiers"], type: "object" });
  });

  test("supplier_reconfirm asks to restate, not assume, prior terms", () => {
    const { task } = buildSupplierTaskTemplate("supplier_reconfirm", {
      productName: "Unbranded takeaway bags",
      supplierName: "Metro Packaging",
      unitLabel: "carton",
    });

    expect(task).toContain("reconfirm");
    expect(task).toContain("do not assume");
  });
});
