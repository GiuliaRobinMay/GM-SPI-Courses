/**
 * Helpers for getting clean text out of the files people actually have:
 * YouTube .vtt / .srt exports, plain .txt and .md notes.
 *
 * PDF and Word are accepted by the picker but need a parser that only makes
 * sense server-side — see README "Next steps". Until then the dialog asks for
 * pasted text and keeps the original file name for provenance.
 */

const TIMESTAMP_LINE =
  /^\s*(\d{1,2}:)?\d{1,2}:\d{2}([.,]\d{1,3})?\s*-->\s*(\d{1,2}:)?\d{1,2}:\d{2}([.,]\d{1,3})?/;
const CUE_NUMBER = /^\d+$/;
const INLINE_TAGS = /<[^>]+>/g;
const BRACKETED_NOISE = /^\[(music|applause|laughter|silence)]$/i;

export function cleanCaptions(raw: string): string {
  const lines = raw.replace(/\r/g, "").split("\n");
  const out: string[] = [];

  for (const line of lines) {
    const text = line.trim();
    if (!text) continue;
    if (text === "WEBVTT" || text.startsWith("NOTE ")) continue;
    if (TIMESTAMP_LINE.test(text)) continue;
    if (CUE_NUMBER.test(text)) continue;
    const stripped = text.replace(INLINE_TAGS, "").trim();
    if (!stripped || BRACKETED_NOISE.test(stripped)) continue;
    // Caption files repeat the previous line while scrolling.
    if (out[out.length - 1] === stripped) continue;
    out.push(stripped);
  }

  return out
    .join(" ")
    .replace(/\s+/g, " ")
    .replace(/([.!?])\s+/g, "$1\n\n")
    .trim();
}

export function looksLikeCaptions(text: string): boolean {
  return /-->/.test(text.slice(0, 2000)) || text.trimStart().startsWith("WEBVTT");
}

export function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

/** Pull a YouTube id out of the usual URL shapes, for thumbnails and embeds. */
export function youtubeId(url?: string): string | null {
  if (!url) return null;
  const patterns = [
    /youtube\.com\/watch\?[^#]*\bv=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}
