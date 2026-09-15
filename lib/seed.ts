import type { Course, Database } from "./types";

const now = "2026-09-15T09:00:00.000Z";

/**
 * The starting library: the SPI courses, empty and ready for material.
 *
 * Titles and links are the real ones from the community. Levels come from how
 * SPI groups them, and show as tracks. Every course starts with no lessons —
 * they arrive by importing a course file (docs/import-format.md) or by adding
 * material by hand.
 */

interface Spec {
  slug: string;
  title: string;
  track: string;
  trackOrder: number;
  accent: Course["accent"];
}

const SPI: Spec[] = [
  // Level 0 — start here
  { slug: "business-101-smart-from-scratch", title: "Smart From Scratch", track: "Level 0 — Start here", trackOrder: 0, accent: "emerald" },
  { slug: "list-building-mini-course", title: "List Building Mini-Course", track: "Level 0 — Start here", trackOrder: 0, accent: "emerald" },

  // Level 1 — build an audience
  { slug: "1-2-3-affiliate-marketing", title: "1•2•3 Affiliate Marketing", track: "Level 1 — Build an audience", trackOrder: 1, accent: "sky" },
  { slug: "short-form-formula", title: "Short-Form Formula", track: "Level 1 — Build an audience", trackOrder: 1, accent: "sky" },
  { slug: "sponsor-me", title: "Sponsor Me", track: "Level 1 — Build an audience", trackOrder: 1, accent: "sky" },
  { slug: "landing-pages-101", title: "Landing Pages 101", track: "Level 1 — Build an audience", trackOrder: 1, accent: "sky" },
  { slug: "lead-magnet-mini-series", title: "Lead Magnet Mini-Series", track: "Level 1 — Build an audience", trackOrder: 1, accent: "sky" },

  // Level 2 — build the business
  { slug: "for-hire", title: "For Hire", track: "Level 2 — Build the business", trackOrder: 2, accent: "indigo" },
  { slug: "email-marketing-magic-course", title: "Email Marketing Magic", track: "Level 2 — Build the business", trackOrder: 2, accent: "indigo" },
  { slug: "heroic-online-courses-course", title: "Heroic Online Courses", track: "Level 2 — Build the business", trackOrder: 2, accent: "indigo" },
  { slug: "power-up-podcasting-course", title: "Power-Up Podcasting", track: "Level 2 — Build the business", trackOrder: 2, accent: "indigo" },
  { slug: "simple-site-success", title: "Simple Site Success", track: "Level 2 — Build the business", trackOrder: 2, accent: "indigo" },
  { slug: "smart-offer-design", title: "Smart Offer Design", track: "Level 2 — Build the business", trackOrder: 2, accent: "indigo" },
  { slug: "youtube-from-scratch-course", title: "YouTube From Scratch", track: "Level 2 — Build the business", trackOrder: 2, accent: "indigo" },

  // Level 3 — scale it
  { slug: "a-to-z-webinars", title: "A to Z Webinars", track: "Level 3 — Scale it", trackOrder: 3, accent: "violet" },
  { slug: "community-business-blueprint-course", title: "Community Business Blueprint", track: "Level 3 — Scale it", trackOrder: 3, accent: "violet" },
];

const courses: Course[] = SPI.map((spec) => ({
  id: `co-spi-${spec.slug}`,
  facultyId: "fa-spi",
  title: spec.title,
  creatorId: "cr-spi",
  sourceUrl: `https://community.smartpassiveincome.com/c/${spec.slug}`,
  topics: [],
  accent: spec.accent,
  track: spec.track,
  trackOrder: spec.trackOrder,
  createdAt: now,
  updatedAt: now,
}));

export const SEED: Database = {
  version: 1,
  creators: [
    { id: "cr-self", name: "Giulia", isSelf: true },
    {
      id: "cr-spi",
      name: "Smart Passive Income",
      handle: "@smartpassiveincome",
      url: "https://community.smartpassiveincome.com",
    },
  ],
  faculties: [
    {
      id: "fa-spi",
      name: "Smart Passive Income",
      icon: "cap",
      accent: "emerald",
      order: 0,
      description: "The SPI community library.",
    },
  ],
  courses,
  lessons: [],
};
