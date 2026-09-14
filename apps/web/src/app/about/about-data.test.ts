import { describe, expect, test } from "bun:test";

import { aboutSlides, clampSlideNumber } from "./about-data";

describe("about carousel data", () => {
  test("keeps the seven-scene demo narrative in a stable order", () => {
    expect(aboutSlides.map((slide) => slide.id)).toEqual([
      "minimums",
      "conversations",
      "threshold",
      "proposal",
      "shortfall",
      "reconfirm",
      "accountability",
    ]);
  });

  test("accepts valid deep-linked slides", () => {
    expect(clampSlideNumber("4")).toBe(4);
    expect(clampSlideNumber(7)).toBe(7);
  });

  test("returns to the opening scene for invalid slide values", () => {
    expect(clampSlideNumber(null)).toBe(1);
    expect(clampSlideNumber("0")).toBe(1);
    expect(clampSlideNumber("8")).toBe(1);
    expect(clampSlideNumber("three")).toBe(1);
    expect(clampSlideNumber("2.5")).toBe(1);
  });
});
