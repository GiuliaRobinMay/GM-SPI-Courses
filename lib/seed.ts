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
  icon: string;
}

/**
 * The four colours the interface was built around. Courses take them in turn
 * down the sidebar, so no two neighbours match and the list stays readable at
 * a glance. Colour carries no meaning here — the level does that.
 */
const PALETTE: Course["accent"][] = ["violet", "rose", "emerald", "amber"];

const SPI: Spec[] = [
  // Level 0 — start here
  { slug: "business-101-smart-from-scratch", title: "Smart From Scratch", track: "Level 0 — Start here", trackOrder: 0, icon: "lightbulb" },
  { slug: "list-building-mini-course", title: "List Building Mini-Course", track: "Level 0 — Start here", trackOrder: 0, icon: "users" },

  // Level 1 — build an audience
  { slug: "1-2-3-affiliate-marketing", title: "1•2•3 Affiliate Marketing", track: "Level 1 — Build an audience", trackOrder: 1, icon: "link" },
  { slug: "short-form-formula", title: "Short-Form Formula", track: "Level 1 — Build an audience", trackOrder: 1, icon: "video" },
  { slug: "sponsor-me", title: "Sponsor Me", track: "Level 1 — Build an audience", trackOrder: 1, icon: "handshake" },
  { slug: "landing-pages-101", title: "Landing Pages 101", track: "Level 1 — Build an audience", trackOrder: 1, icon: "layout" },
  { slug: "lead-magnet-mini-series", title: "Lead Magnet Mini-Series", track: "Level 1 — Build an audience", trackOrder: 1, icon: "magnet" },

  // Level 2 — build the business
  { slug: "for-hire", title: "For Hire", track: "Level 2 — Build the business", trackOrder: 2, icon: "briefcase" },
  { slug: "email-marketing-magic-course", title: "Email Marketing Magic", track: "Level 2 — Build the business", trackOrder: 2, icon: "mail" },
  { slug: "heroic-online-courses-course", title: "Heroic Online Courses", track: "Level 2 — Build the business", trackOrder: 2, icon: "cap" },
  { slug: "power-up-podcasting-course", title: "Power-Up Podcasting", track: "Level 2 — Build the business", trackOrder: 2, icon: "mic" },
  { slug: "simple-site-success", title: "Simple Site Success", track: "Level 2 — Build the business", trackOrder: 2, icon: "globe" },
  { slug: "smart-offer-design", title: "Smart Offer Design", track: "Level 2 — Build the business", trackOrder: 2, icon: "target" },
  { slug: "youtube-from-scratch-course", title: "YouTube From Scratch", track: "Level 2 — Build the business", trackOrder: 2, icon: "camera" },

  // Level 3 — scale it
  { slug: "a-to-z-webinars", title: "A to Z Webinars", track: "Level 3 — Scale it", trackOrder: 3, icon: "presentation" },
  { slug: "community-business-blueprint-course", title: "Community Business Blueprint", track: "Level 3 — Scale it", trackOrder: 3, icon: "community" },
];

/** Alphabetical, because that is the order the sidebar shows them in. */
const byTitle = [...SPI].sort((a, b) => a.title.localeCompare(b.title));

const accentFor = (slug: string): Course["accent"] =>
  PALETTE[byTitle.findIndex((spec) => spec.slug === slug) % PALETTE.length];

const courses: Course[] = SPI.map((spec) => ({
  id: `co-spi-${spec.slug}`,
  facultyId: "fa-spi",
  title: spec.title,
  creatorId: "cr-spi",
  sourceUrl: `https://community.smartpassiveincome.com/c/${spec.slug}`,
  topics: [],
  accent: accentFor(spec.slug),
  icon: spec.icon,
  track: spec.track,
  trackOrder: spec.trackOrder,
  createdAt: now,
  updatedAt: now,
}));

export const SEED: Database = {
  version: 1,
  starterVersion: 2,
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
      name: "SPI courses",
      icon: "cap",
      accent: "violet",
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
export const STARTER_VERSION = 2;

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

  // Colour, icon and collection name are ours to keep current; anything the
  // reader owns — priority, planned day, lessons, notes — is left alone.
  const starterCourse = new Map(starter.courses.map((c) => [c.id, c]));
  const starterFaculty = new Map(starter.faculties.map((f) => [f.id, f]));

  return {
    added: newCourses.length,
    db: {
      ...db,
      starterVersion: 2,
      faculties: [
        ...db.faculties.map((f) => {
          const fresh = starterFaculty.get(f.id);
          return fresh ? { ...f, name: fresh.name, icon: fresh.icon, accent: fresh.accent } : f;
        }),
        ...starter.faculties.filter((f) => !facultyIds.has(f.id)),
      ],
      creators: [
        ...db.creators,
        ...starter.creators.filter((c) => !creatorIds.has(c.id)),
      ],
      courses: [
        ...db.courses.map((c) => {
          const fresh = starterCourse.get(c.id);
          return fresh ? { ...c, accent: fresh.accent, icon: fresh.icon } : c;
        }),
        ...newCourses,
      ],
    },
  };
}
