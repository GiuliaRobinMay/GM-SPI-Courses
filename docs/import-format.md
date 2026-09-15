# Course import format

One JSON file describes one course and its lessons. Drop files on
**Settings → Add course files** (several at once is fine). Importing **merges**:
nothing already in the library is removed, and re-importing the same course
updates it in place instead of creating a duplicate.

## Shape

```jsonc
{
  "format": "studiolo.course",   // required, exactly this
  "version": 1,                  // required

  // Optional. Matched by name; created if it doesn't exist.
  "faculty": {
    "name": "Smart Passive Income",
    "icon": "cap",               // see components/Icon.tsx for names
    "accent": "emerald",         // indigo | violet | sky | emerald | amber | rose | slate
    "description": "The SPI community library."
  },

  // Optional. Matched by name; created if it doesn't exist.
  "creator": {
    "name": "Pat Flynn",
    "handle": "@patflynn",
    "url": "https://smartpassiveincome.com"
  },

  "course": {
    "externalId": "spi-smart-from-scratch",  // recommended, see Re-importing
    "title": "Smart From Scratch",
    "subtitle": "Validate an idea before you build it",
    "description": "…",
    "sourceUrl": "https://community.smartpassiveincome.com/c/…",
    "topics": ["validation", "audience"],
    "track": "Level 0",          // groups courses into a progression
    "trackOrder": 0              // lower sorts first; Level 0 → 0, Level 1 → 1, …
  },

  "lessons": [
    {
      "externalId": "spi-sfs-1-1",
      "title": "Why most ideas fail",
      "section": "1. Find your idea",   // groups lessons inside the course
      "sectionOrder": 1,                // lower sorts first
      "order": 0,                       // position within the section
      "sourceKind": "transcript",       // transcript | video | pdf | document | article | post | note
      "videoUrl": "https://…",          // embeds if YouTube/Vimeo/Loom, else a link-out card
      "sourceUrl": "https://…",         // back to the lesson on the original platform
      "transcript": "Full spoken transcript…",
      "content": "Key points, the action item, workbook links…",
      "topics": ["mindset"],
      "durationMinutes": 11
    }
  ]
}
```

Only `format`, `version`, `course.title` and `lessons` (which may be empty) are
required. Every lesson needs a `title`; everything else is optional.

## The three fields that carry structure

- **`track`** on the course groups courses into a progression on the faculty
  page — Level 0, Level 1, Companion, Onboarding. `trackOrder` decides the order
  of the groups themselves. Courses with no track collect under "Courses" last.
- **`section`** on a lesson groups lessons into modules on the course page.
  `sectionOrder` orders the sections, `order` orders lessons inside one.
- **`content`** is the author's written material (key points, action item,
  workbook links). It is kept apart from `transcript` (what was said) and from
  your own notes, and shows as its own "Lesson text" tab.

## Re-importing

Give `externalId` the id the source platform uses, and pulling a course twice
updates the existing entry. Without one, a course is matched on its title
within the faculty, and a lesson on its title within the course — workable, but
a renamed lesson then arrives as a second copy.

Re-importing **preserves** what you have done with a lesson: its status, and
your notes. It replaces the source material: transcript, lesson text, links.
So a course can be imported early as titles only, then re-imported once the
transcripts are filled in.

## Posts, not just lessons

A community post is a lesson with `sourceKind: "post"`, `content` filled in and
no video. That is how a path made of posts (a Superfans level, an accelerator
week) becomes a course: `track` for the level, `section` for the week.

## Worked example

`docs/examples/spi-smart-from-scratch.json` is a real-shaped file: an SPI
course with a track, two sections and four lessons, showing a transcript
lesson, a lesson with written text only, and a post.
