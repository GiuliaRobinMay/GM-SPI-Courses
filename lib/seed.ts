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
  icon: string;
}

const SPI: Spec[] = [
  // Level 0 — start here
  { slug: "business-101-smart-from-scratch", title: "Smart From Scratch", track: "Level 0 — Start here", trackOrder: 0, accent: "emerald", icon: "lightbulb" },
  { slug: "list-building-mini-course", title: "List Building Mini-Course", track: "Level 0 — Start here", trackOrder: 0, accent: "emerald", icon: "users" },

  // Level 1 — build an audience
  { slug: "1-2-3-affiliate-marketing", title: "1•2•3 Affiliate Marketing", track: "Level 1 — Build an audience", trackOrder: 1, accent: "sky", icon: "link" },
  { slug: "short-form-formula", title: "Short-Form Formula", track: "Level 1 — Build an audience", trackOrder: 1, accent: "sky", icon: "video" },
  { slug: "sponsor-me", title: "Sponsor Me", track: "Level 1 — Build an audience", trackOrder: 1, accent: "sky", icon: "handshake" },
  { slug: "landing-pages-101", title: "Landing Pages 101", track: "Level 1 — Build an audience", trackOrder: 1, accent: "sky", icon: "layout" },
  { slug: "lead-magnet-mini-series", title: "Lead Magnet Mini-Series", track: "Level 1 — Build an audience", trackOrder: 1, accent: "sky", icon: "magnet" },

  // Level 2 — build the business
  { slug: "for-hire", title: "For Hire", track: "Level 2 — Build the business", trackOrder: 2, accent: "indigo", icon: "briefcase" },
  { slug: "email-marketing-magic-course", title: "Email Marketing Magic", track: "Level 2 — Build the business", trackOrder: 2, accent: "indigo", icon: "mail" },
  { slug: "heroic-online-courses-course", title: "Heroic Online Courses", track: "Level 2 — Build the business", trackOrder: 2, accent: "indigo", icon: "cap" },
  { slug: "power-up-podcasting-course", title: "Power-Up Podcasting", track: "Level 2 — Build the business", trackOrder: 2, accent: "indigo", icon: "mic" },
  { slug: "simple-site-success", title: "Simple Site Success", track: "Level 2 — Build the business", trackOrder: 2, accent: "indigo", icon: "globe" },
  { slug: "smart-offer-design", title: "Smart Offer Design", track: "Level 2 — Build the business", trackOrder: 2, accent: "indigo", icon: "target" },
  { slug: "youtube-from-scratch-course", title: "YouTube From Scratch", track: "Level 2 — Build the business", trackOrder: 2, accent: "indigo", icon: "camera" },

  // Level 3 — scale it
  { slug: "a-to-z-webinars", title: "A to Z Webinars", track: "Level 3 — Scale it", trackOrder: 3, accent: "violet", icon: "presentation" },
  { slug: "community-business-blueprint-course", title: "Community Business Blueprint", track: "Level 3 — Scale it", trackOrder: 3, accent: "violet", icon: "community" },
];

const courses: Course[] = SPI.map((spec) => ({
  id: `co-spi-${spec.slug}`,
  facultyId: "fa-spi",
  title: spec.title,
  creatorId: "cr-spi",
  sourceUrl: `https://community.smartpassiveincome.com/c/${spec.slug}`,
  topics: [],
  accent: spec.accent,
  icon: spec.icon,
  track: spec.track,
  trackOrder: spec.trackOrder,
  createdAt: now,
  updatedAt: now,
}));

export const SEED: Database = {
  version: 1,
  starterVersion: 1,
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

/**
 * The edition of the list above. Raise it after changing the courses and
 * every existing library picks up the additions once, on next load.
 */
export const STARTER_VERSION = 1;

/**
 * Put the starter courses into a library, skipping anything already there.
 *
 * New course lists otherwise never reach anyone who has used the app before:
 * stored data wins over a seed, so the only way to see them was to wipe
 * everything first. This merges instead — no lesson, note or status is
 * touched, and a course deleted on purpose stays deleted, because the
 * library records that it has already been given this edition.
 */
export function withStarterCourses(db: Database): {
  db: Database;
  added: number;
} {
  if (db.starterVersion === STARTER_VERSION) return { db, added: 0 };

  const starter = SEED;
  const courseIds = new Set(db.courses.map((c) => c.id));
  const facultyIds = new Set(db.faculties.map((f) => f.id));
  const creatorIds = new Set(db.creators.map((c) => c.id));
  const newCourses = starter.courses.filter((c) => !courseIds.has(c.id));

  return {
    added: newCourses.length,
    db: {
      ...db,
      starterVersion: STARTER_VERSION,
      faculties: [
        ...db.faculties,
        ...starter.faculties.filter((f) => !facultyIds.has(f.id)),
      ],
      creators: [
        ...db.creators,
        ...starter.creators.filter((c) => !creatorIds.has(c.id)),
      ],
      courses: [...db.courses, ...newCourses],
    },
  };
}
