# Studiolo

A private university for the things you actually learn from.

You file a transcript, a video link, or a document under a course, and Studiolo
turns it into two things you can use: **highlights** (what this material is
actually saying) and **step by step** (what to do to set it up). Everything
keeps its provenance — who made it, which course it came from, the link back to
the original.

This is the **template stage**: the full interface works, with all data stored
in your browser. Supabase, accounts, and model-generated study notes come next,
and the code is laid out so those slot in without a rewrite.

---

## The structure

```
Faculty          A field you keep returning to      → sidebar
  └── Course     One body of material, yours or someone else's
        └── Lesson   One transcript / video / document
```

A **lesson** always records where it came from: creator, material type, video
link, link to the original lesson, and the source file name when the text came
from an upload.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm run typecheck`.

The app opens with a small demo library so there is something to look at.
**Settings → Start empty** clears it; **Reset** brings it back.

## What each screen does

| Screen | What it is for |
| --- | --- |
| **Discover** | What you are mid-way through, your faculties, pinned courses, what came in recently |
| **Faculty** | The courses inside one field of study |
| **Course** | Its lessons, filtered by to study / studying / done, with progress and source |
| **Lesson** | The study view: video, highlights, step-by-step checklist, full transcript, your own notes |
| **Library** | Every course across all faculties |
| **Creators** | Who your material came from, and what you have of theirs |
| **Search** | Full text across titles, topics, notes **and every stored transcript** |
| **Settings** | Export / import your library as JSON, reset, clear |

## Getting material in

The **Add material** dialog takes:

- **Pasted text** — a transcript, a chapter, your own notes.
- **File upload** — `.txt`, `.md`, `.vtt`, `.srt`. Subtitle files are stripped
  of timestamps, cue numbers and the duplicate lines YouTube exports, then
  re-flowed into paragraphs (`lib/transcript.ts`).
- **PDF / Word** — the file name is kept for provenance and you paste the text
  for now. Real parsing needs a server and lands with the backend.
- **Video links** — YouTube URLs are embedded in the lesson player; anything
  else becomes an outbound link.

## How highlights and steps are produced

`lib/insights.ts` is the seam where a model will eventually sit. Today it runs
offline and deterministically, so the interface is real without any key or
network call:

- **Highlights** — sentences scored on the transcript's own recurring terms,
  boosted by cue phrases ("the key is", "never", "the mistake"), kept in
  transcript order.
- **Steps** — instruction-shaped sentences (imperative openings, "first",
  "then", "make sure"), de-duplicated and numbered into a checklist you can
  tick off and copy.
- **Tools, recurring terms, links** — pulled from the text as supporting context.

Swapping this for a model call means replacing the body of `analyzeTranscript`
and setting `engine: "model"` on the result. Nothing in the UI has to change.

## Layout of the code

```
app/
  layout.tsx              Provider + shell
  page.tsx                Discover
  faculty/[facultyId]/    Courses in a faculty
  course/[courseId]/      Lessons in a course
  lesson/[lessonId]/      The study view
  library/ creators/ search/ settings/
components/
  AppShell, Sidebar, TopBar        Frame
  FacultyDialog, CourseDialog, LessonDialog, CreatorPicker
  cards.tsx, ui.tsx, Icon.tsx      Cards, primitives, icon registry
lib/
  types.ts        The whole domain model — read this first
  store.tsx       React context: selectors + every mutation
  persistence.ts  The storage boundary (localStorage today)
  insights.ts     Transcript → highlights, steps, tools
  transcript.ts   Caption cleanup, YouTube ids, word count
  seed.ts         The demo library
  theme.ts        Accent tokens
```

Two boundaries are deliberate and worth keeping:

- **No component touches storage.** Everything goes through `useLibrary()`,
  which goes through `persistence.ts`.
- **`Database` in `lib/types.ts` is the wire shape.** It is what Settings
  exports, and what the Supabase tables should mirror.

## Next steps

1. **Supabase** — tables for `faculties`, `courses`, `lessons`, `creators`
   mirroring `lib/types.ts`, then a second `PersistenceAdapter` implementation
   in `lib/persistence.ts`. Move to per-row mutations rather than saving the
   whole snapshot once rows are shared.
2. **Auth and row-level security** — `Creator.isSelf` becomes the signed-in user.
3. **Model-generated study notes** — replace `analyzeTranscript` with a server
   route. Cache the result on the lesson (`Lesson.study` already exists) so it is
   generated once, and keep `engine` so the UI can say which produced it.
4. **PDF and Word parsing** — a server route that extracts text on upload.
5. **Ask across a course** — question answering over every transcript in a
   course, once transcripts live in a database with embeddings.
