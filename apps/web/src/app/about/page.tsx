import type { Metadata } from "next";

import { AboutCarousel } from "./about-carousel";
import { clampSlideNumber } from "./about-data";

export const metadata: Metadata = {
  description:
    "See how CommonLot turns private buyer conversations into a feasible, reviewable shared-purchase proposal.",
  openGraph: {
    description:
      "Three buyers, one supplier threshold, and a proposal that stays honest when the plan changes.",
    title: "How CommonLot works",
    type: "website",
  },
  title: "How it works",
};

export default async function AboutPage({
  searchParams,
}: {
  searchParams: Promise<{ present?: string; slide?: string }>;
}) {
  const parameters = await searchParams;
  return (
    <AboutCarousel
      initialPresenting={parameters.present === "1"}
      initialSlide={clampSlideNumber(parameters.slide ?? null)}
    />
  );
}
