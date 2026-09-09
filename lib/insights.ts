/**
 * Transcript → study material.
 *
 * This is the seam where a language model will eventually live. For the
 * template it runs fully offline with deterministic heuristics, so the UI is
 * real and testable without any keys or network. Swap the body of
 * `analyzeTranscript` for a model call later and nothing else has to change.
 */

import type { ActionStep, Highlight, StudyOutput } from "./types";

const STOPWORDS = new Set(
  `a about above after again against all am an and any are aren't as at be because been before being below between both but by can cannot could couldn't did didn't do does doesn't doing don't down during each few for from further had hadn't has hasn't have haven't having he her here hers herself him himself his how i i'm if in into is isn't it it's its itself just let's me more most mustn't my myself no nor not of off on once only or other ought our ours ourselves out over own same shan't she should shouldn't so some such than that the their theirs them themselves then there these they this those through to too under until up very was wasn't we were weren't what when where which while who whom why with won't would wouldn't you your yours yourself yourselves gonna wanna kinda sorta okay ok yeah yep right like really actually basically literally just now going get got go went thing things stuff guys video channel subscribe today
  `
    .split(/\s+/)
    .filter(Boolean),
);

/** Product names worth surfacing as "tools mentioned". Extend freely. */
const KNOWN_TOOLS = [
  "Claude", "ChatGPT", "GPT", "Gemini", "Midjourney", "Sora", "Runway", "Pika",
  "Suno", "Udio", "ElevenLabs", "Higgsfield", "Notion", "Airtable", "Zapier",
  "Make", "n8n", "Supabase", "Firebase", "Vercel", "Netlify", "Figma", "Canva",
  "Framer", "Webflow", "Wordpress", "Shopify", "Stripe", "HubSpot", "Kit",
  "ConvertKit", "Mailchimp", "Slack", "Discord", "Skool", "Circle", "Teachable",
  "Kajabi", "Loom", "Descript", "CapCut", "Premiere", "DaVinci", "Photoshop",
  "Illustrator", "Blender", "Unreal", "Github", "GitHub", "Cursor", "Replit",
  "Lovable", "Bolt", "Instagram", "TikTok", "YouTube", "LinkedIn", "Pinterest",
  "Facebook", "Threads", "Substack", "Beehiiv", "Google", "Meta", "OpenAI",
  "Anthropic", "Perplexity", "Whisper", "Zoom", "Calendly", "Trello", "Asana",
  "ClickUp", "Miro", "Excel", "Sheets", "Looker", "Tableau",
];

const STEP_CUES = [
  "first", "second", "third", "next", "then", "after that", "finally", "lastly",
  "start by", "begin by", "step one", "step two", "step 1", "step 2", "once you",
  "make sure", "you need to", "you want to", "you have to", "head over",
];

const STEP_VERBS = [
  "go", "open", "click", "select", "choose", "type", "paste", "copy", "add",
  "create", "make", "build", "set", "setup", "install", "download", "upload",
  "connect", "enable", "disable", "drag", "drop", "save", "export", "import",
  "publish", "share", "write", "record", "upload", "duplicate", "rename",
  "hit", "press", "navigate", "sign", "log", "enter", "run", "deploy", "test",
  "check", "review", "repeat", "schedule", "post", "send", "generate", "prompt",
];

const HIGHLIGHT_CUES = [
  "the key", "the most important", "the trick", "the secret", "remember",
  "keep in mind", "the point is", "what matters", "the difference", "biggest",
  "never", "always", "the reason", "the best part", "pro tip", "note that",
  "here's why", "here is why", "the mistake", "avoid",
];

const URL_RE = /https?:\/\/[^\s<>()"'\]]+/gi;

function splitSentences(text: string): string[] {
  return text
    // treat line breaks as sentence boundaries too — transcripts are messy
    .replace(/\r/g, "")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function termFrequency(text: string): Map<string, number> {
  const freq = new Map<string, number>();
  for (const w of words(text)) {
    if (w.length < 4 || STOPWORDS.has(w)) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  return freq;
}

function startsWithStepVerb(sentence: string): boolean {
  const first = words(sentence)[0];
  if (!first) return false;
  return STEP_VERBS.includes(first);
}

function containsAny(haystack: string, needles: string[]): boolean {
  const lower = haystack.toLowerCase();
  return needles.some((n) => lower.includes(n));
}

function findTools(text: string): string[] {
  const found = new Set<string>();
  for (const tool of KNOWN_TOOLS) {
    const re = new RegExp(`\\b${tool.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(text)) found.add(tool);
  }
  return [...found].sort();
}

/** Trim filler and normalise a spoken-word sentence into something readable. */
function tidy(sentence: string): string {
  let s = sentence.trim();
  s = s.replace(/^(so|and|but|okay|ok|now|well|yeah|alright|right)[,\s]+/i, "");
  s = s.replace(/\s+/g, " ");
  s = s.replace(/^\w/, (c) => c.toUpperCase());
  if (!/[.!?]$/.test(s)) s += ".";
  return s;
}

export function analyzeTranscript(transcript: string): StudyOutput {
  const clean = transcript.trim();
  const sentences = splitSentences(clean);
  const freq = termFrequency(clean);

  const terms = [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 12)
    .map(([term, count]) => ({ term, count }));

  const topTerms = new Set(terms.slice(0, 8).map((t) => t.term));

  /* ---- highlights: sentences dense in top terms or carrying a cue ---- */
  const scored = sentences.map((sentence, i) => {
    const ws = words(sentence);
    if (ws.length < 6 || ws.length > 60) return { sentence, i, score: -1 };
    let score = ws.filter((w) => topTerms.has(w)).length;
    if (containsAny(sentence, HIGHLIGHT_CUES)) score += 3;
    if (/\d/.test(sentence)) score += 0.5;
    // slight preference for the opening third, where the thesis usually sits
    score += (1 - i / Math.max(sentences.length, 1)) * 0.75;
    return { sentence, i, score };
  });

  const highlights: Highlight[] = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 7)
    .sort((a, b) => a.i - b.i)
    .map((s) => ({
      text: tidy(s.sentence),
      position: sentences.length ? s.i / sentences.length : 0,
    }));

  /* ---- steps: instruction-shaped sentences, in transcript order ---- */
  const stepCandidates = sentences.filter((s) => {
    const ws = words(s);
    if (ws.length < 3 || ws.length > 45) return false;
    return startsWithStepVerb(s) || containsAny(s, STEP_CUES);
  });

  const seen = new Set<string>();
  const steps: ActionStep[] = [];
  for (const candidate of stepCandidates) {
    const text = tidy(candidate);
    const key = text.toLowerCase().slice(0, 60);
    if (seen.has(key)) continue;
    seen.add(key);
    steps.push({ index: steps.length + 1, text, tools: findTools(candidate) });
    if (steps.length >= 12) break;
  }

  const links = [...new Set(clean.match(URL_RE) ?? [])].slice(0, 20);

  const summary =
    highlights.length > 0
      ? highlights
          .slice(0, 2)
          .map((h) => h.text)
          .join(" ")
      : tidy(sentences.slice(0, 2).join(" ") || "No transcript yet.");

  return {
    summary,
    highlights,
    steps,
    tools: findTools(clean),
    terms,
    links,
    engine: "heuristic",
    generatedAt: new Date().toISOString(),
  };
}

/** Rough reading/watching time, used when no duration was recorded. */
export function estimateMinutes(transcript: string): number {
  const count = words(transcript).length;
  return Math.max(1, Math.round(count / 140)); // ~140 spoken words per minute
}
