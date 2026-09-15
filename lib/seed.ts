import type { Database } from "./types";

const now = "2026-01-12T09:00:00.000Z";

/**
 * Demo content so the template has something to look at on first run.
 * "Reset demo data" in Settings restores exactly this snapshot.
 */
export const SEED: Database = {
  version: 1,
  creators: [
    { id: "cr-self", name: "Giulia", handle: "@you", isSelf: true },
    { id: "cr-futurepedia", name: "Futurepedia", handle: "@futurepedia", url: "https://youtube.com/@futurepedia" },
    { id: "cr-riley", name: "Riley Brown", handle: "@rileybrown", url: "https://youtube.com/@rileybrownai" },
    { id: "cr-marta", name: "Marta Vidal", handle: "@martacooks", url: "https://martavidal.example" },
  ],
  faculties: [
    { id: "fa-ai", name: "AI & Automation", icon: "sparkles", accent: "indigo", order: 0, description: "Agents, prompting, workflows that run themselves." },
    { id: "fa-content", name: "Social & Content", icon: "megaphone", accent: "rose", order: 1, description: "Everything that gets made, posted and measured." },
    { id: "fa-business", name: "Business & Offers", icon: "briefcase", accent: "emerald", order: 2, description: "Positioning, pricing, launches, sales." },
    { id: "fa-craft", name: "Food & Craft", icon: "chefhat", accent: "amber", order: 3, description: "Hands-on skills studied the same way as everything else." },
  ],
  courses: [
    {
      id: "co-agents",
      facultyId: "fa-ai",
      title: "Building Agents That Actually Ship",
      subtitle: "From a single prompt to a working automation",
      description:
        "A working method for turning a repeated manual task into an agent you trust: scope it, give it tools, watch it fail, tighten the loop.",
      creatorId: "cr-riley",
      sourceUrl: "https://youtube.com/@rileybrownai",
      topics: ["agents", "automation", "prompting"],
      accent: "indigo",
      track: "Level 1 — Foundations",
      trackOrder: 1,
      createdAt: now,
      updatedAt: now,
      favorite: true,
    },
    {
      id: "co-video",
      facultyId: "fa-content",
      title: "AI Video Toolkit",
      subtitle: "Image to video, voice, and edit",
      description: "Tool-by-tool walkthrough of the current generative video stack.",
      creatorId: "cr-futurepedia",
      sourceUrl: "https://youtube.com/@futurepedia",
      topics: ["video", "midjourney", "editing"],
      accent: "rose",
      track: "Companion",
      trackOrder: 9,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "co-offer",
      facultyId: "fa-business",
      title: "The Offer Rewrite",
      subtitle: "My own course — recorded live",
      description: "The five sessions I run with clients when their offer is not converting.",
      creatorId: "cr-self",
      topics: ["positioning", "pricing", "sales"],
      accent: "emerald",
      track: "Level 2 — Build the offer",
      trackOrder: 2,
      createdAt: now,
      updatedAt: now,
      favorite: true,
    },
    {
      id: "co-bread",
      facultyId: "fa-craft",
      title: "Sourdough Fundamentals",
      subtitle: "Starter, shaping, bake",
      description: "Studied like a technical course, because it is one.",
      creatorId: "cr-marta",
      topics: ["baking", "fermentation"],
      accent: "amber",
      createdAt: now,
      updatedAt: now,
    },
  ],
  lessons: [
    {
      id: "le-agent-1",
      courseId: "co-agents",
      title: "Scoping an agent so it can't wander",
      creatorId: "cr-riley",
      order: 0,
      status: "done",
      section: "1. Draw the boundary",
      sectionOrder: 1,
      sourceKind: "transcript",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      sourceUrl: "https://youtube.com/@rileybrownai",
      topics: ["agents", "scoping"],
      durationMinutes: 14,
      createdAt: now,
      updatedAt: now,
      transcript: `So the biggest mistake people make with agents is that they hand over a job they could not explain to a new hire. The key is that an agent can only be as reliable as the boundary you draw around it.

Start by writing the task out as if you were briefing a person for their first day. Then open a blank document and list every tool that task touches. If the list has more than four tools, the scope is too wide and you should split it.

Next, go to your prompt and write the failure cases first. Most people write the happy path and then wonder why it breaks. Write down what should happen when a field is empty, when the API is down, when the input is in the wrong language.

Then create a small test set. Take ten real examples from last month and run them through. Never ship an agent you have not run against real historical data, because synthetic examples hide the messy cases.

After that, add logging. Save every input and output to a table in Supabase or even a Google Sheet, and review it once a week. The trick is that reviewing twenty real runs teaches you more than a week of prompt tweaking.

Finally, set a hard stop. Give the agent a maximum number of steps and a budget, and make it hand back to a human when it exceeds either. Remember that the value is not full autonomy, it is a loop that a person can trust and check.`,
      content: `Key points
- An agent is only as reliable as the boundary drawn around it.
- More than four tools in scope means the scope is wrong.
- Write the failure cases before the happy path.

Action item
Take one task you repeat weekly. Write the brief you would hand a new starter, then list every tool it touches. If the list runs past four, split the task and start again.

Workbook
Section 2, pages 11 to 14.`,
      notes: "Use this framing for the client onboarding bot.",
    },
    {
      id: "le-agent-2",
      courseId: "co-agents",
      title: "Giving an agent tools without giving it the keys",
      creatorId: "cr-riley",
      order: 0,
      status: "studying",
      section: "2. Hand over the tools",
      sectionOrder: 2,
      sourceKind: "transcript",
      topics: ["agents", "security"],
      createdAt: now,
      updatedAt: now,
      transcript: `The point is that every tool you add to an agent is a new way for it to be wrong. Keep the tool list short and make each tool do one thing.

First, wrap the API instead of exposing it. Create a small function that takes three arguments and validates them, rather than letting the model call the raw endpoint.

Then add a read-only mode. Run the agent for a week where it can only propose actions, and review what it would have done.

Make sure every destructive action is confirmed by a human. Never let an agent delete, refund or send on its own until you have a month of clean logs.`,
    },
    {
      id: "le-video-1",
      courseId: "co-video",
      title: "10 free AI animation tools: bring images to life",
      creatorId: "cr-futurepedia",
      order: 0,
      status: "todo",
      sourceKind: "video",
      // Deliberately not YouTube: shows the link-out card a course platform gets.
      videoUrl: "https://vimeo.example.com/course/animation-tools",
      sourceUrl: "https://futurepedia.example/lesson/animation-tools",
      topics: ["video", "animation"],
      durationMinutes: 12,
      createdAt: now,
      updatedAt: now,
      transcript: "",
    },
    {
      id: "le-offer-1",
      courseId: "co-offer",
      title: "Session 1 — Why the offer isn't landing",
      creatorId: "cr-self",
      order: 0,
      status: "todo",
      sourceKind: "transcript",
      topics: ["positioning"],
      createdAt: now,
      updatedAt: now,
      content: `Key points
- Price is rarely the problem. A promise the buyer cannot repeat back is.
- The words your buyer uses are the words your page should use.
- The sentence where a call goes quiet is where the promise stopped being concrete.

Action item
Read your sales page aloud to someone outside your industry and write down how they describe what you sell.`,
      transcript: `The reason most offers do not convert is not the price, it is that the buyer cannot repeat the promise back to you in one sentence.

Start by reading your sales page out loud to someone outside your industry. Then ask them to explain what you sell. Write down the exact words they use.

Next, take the three most recent calls you lost and find the sentence where the conversation went quiet. That sentence is usually where the promise stopped being concrete.`,
    },
    {
      id: "le-bread-1",
      courseId: "co-bread",
      title: "Building and reading a starter",
      creatorId: "cr-marta",
      order: 0,
      status: "todo",
      sourceKind: "transcript",
      topics: ["fermentation"],
      createdAt: now,
      updatedAt: now,
      transcript: `A starter is a culture you are reading, not a recipe you are following. The key is to feed on a schedule and watch the rise, not the clock.

Start by mixing fifty grams of flour with fifty grams of water at room temperature. Then leave it uncovered for one hour before sealing it loosely.

Every day, discard all but twenty grams and feed it again. Make sure the water is never hotter than thirty degrees, because heat kills the culture you are trying to build.

Once it doubles within four hours, it is ready to bake with. Remember that a sluggish starter is almost always a temperature problem, not a flour problem.`,
    },
  ],
};
