export type AboutSlideId =
  | "minimums"
  | "conversations"
  | "threshold"
  | "proposal"
  | "shortfall"
  | "reconfirm"
  | "accountability";

export type AboutSlideAccent = "blue" | "green" | "red" | "amber";

export type AboutSlideComposition =
  | "studio"
  | "product"
  | "pool"
  | "proposal"
  | "change"
  | "reconfirm"
  | "audit";

export interface AboutScreenshot {
  alt: string;
  crop: "calls" | "order" | "proposal" | "readiness";
  src: string;
}

export interface AboutSlide {
  accent: AboutSlideAccent;
  beats: readonly [number, number, number];
  composition: AboutSlideComposition;
  description: string;
  eyebrow: string;
  id: AboutSlideId;
  screenshots?: readonly AboutScreenshot[];
  takeaway: string;
  title: string;
}

export const aboutSlides: readonly AboutSlide[] = [
  {
    accent: "amber",
    beats: [0, 240, 700],
    composition: "studio",
    description:
      "Three neighbourhood businesses need stock. None can reach the supplier's wholesale tier alone.",
    eyebrow: "The purchasing gap",
    id: "minimums",
    takeaway:
      "Wholesale starts at 30 cartons. Each buyer shops one conversation at a time.",
    title: "Small buyers. Big minimums.",
  },
  {
    accent: "blue",
    beats: [0, 260, 760],
    composition: "product",
    description:
      "Quantity, price limits, and timing live in separate phone calls—usually followed by a spreadsheet chase.",
    eyebrow: "The coordination problem",
    id: "conversations",
    screenshots: [
      {
        alt: "CommonLot Calls workspace showing structured buyer conditions from fictional demo conversations",
        crop: "calls",
        src: "/about/commonlot-calls.png",
      },
    ],
    takeaway:
      "CommonLot turns private conversations into structured purchasing conditions.",
    title: "The real terms are trapped in calls.",
  },
  {
    accent: "green",
    beats: [0, 220, 740],
    composition: "pool",
    description:
      "CommonLot combines compatible requests against the supplier's price break while each buyer's limit stays private.",
    eyebrow: "The collective advantage",
    id: "threshold",
    takeaway: "Together, the group unlocks an all-in price of ₹950 per carton.",
    title: "12 + 10 + 8 unlocks the lot.",
  },
  {
    accent: "green",
    beats: [0, 200, 700],
    composition: "proposal",
    description:
      "The organizer sees one reviewable proposal with its quantity, landed cost, and potential savings explained.",
    eyebrow: "A decision, not a black box",
    id: "proposal",
    screenshots: [
      {
        alt: "CommonLot proposal spotlight showing a feasible 30-carton proposal, ₹950 all-in price, ₹28,500 total, and ₹7,500 estimated savings",
        crop: "proposal",
        src: "/about/commonlot-proposal.png",
      },
    ],
    takeaway:
      "It is a feasible proposal—not an order—and the organizer stays in control.",
    title: "A workable proposal appears.",
  },
  {
    accent: "red",
    beats: [0, 260, 760],
    composition: "change",
    description:
      "Buyer C changes from 8 cartons to 6. CommonLot withdraws the earlier result instead of leaving a stale promise in place.",
    eyebrow: "Plans change",
    id: "shortfall",
    screenshots: [
      {
        alt: "CommonLot proposal spotlight showing 28 cartons and a two-carton shortfall",
        crop: "proposal",
        src: "/about/commonlot-shortfall.png",
      },
    ],
    takeaway: "The group is now two cartons short of the supplier's tier.",
    title: "One changed answer breaks the plan.",
  },
  {
    accent: "blue",
    beats: [0, 240, 820],
    composition: "reconfirm",
    description:
      "Buyer A can take 14 cartons, but the old ₹11,400 authorization cannot cover the larger total. A new ceiling must be explicit.",
    eyebrow: "Consent is part of feasibility",
    id: "reconfirm",
    screenshots: [
      {
        alt: "CommonLot showing the 30-carton proposal blocked because an existing buyer authorization is too low",
        crop: "readiness",
        src: "/about/commonlot-cap-blocked.png",
      },
      {
        alt: "CommonLot showing the proposal ready after Buyer A explicitly reconfirms a ₹13,300 ceiling",
        crop: "readiness",
        src: "/about/commonlot-reconfirmed.png",
      },
    ],
    takeaway: "After reconfirmation: 14 + 10 + 6 = 30, ready for review again.",
    title: "CommonLot reconfirms the moving pieces.",
  },
  {
    accent: "blue",
    beats: [0, 200, 760],
    composition: "audit",
    description:
      "Every result keeps its evidence mode, structured outcome, and place in the organizer-controlled order timeline.",
    eyebrow: "A trustworthy record",
    id: "accountability",
    screenshots: [
      {
        alt: "CommonLot Calls workspace showing fictional call evidence and structured results",
        crop: "calls",
        src: "/about/commonlot-calls.png",
      },
      {
        alt: "CommonLot organizer-controlled order timeline using illustrative demo data",
        crop: "order",
        src: "/about/commonlot-order.png",
      },
    ],
    takeaway: "From scattered calls to a proposal everyone can trust.",
    title: "Every decision remains accountable.",
  },
] as const;

export const clampSlideNumber = (value: string | number | null): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > aboutSlides.length) {
    return 1;
  }
  return parsed;
};
