"""Strip community housekeeping out of imported lesson text.

What goes is the stuff a member is told to DO inside that community — mark
complete, comment below, join us live. What stays is anything that teaches:
the explanation, the steps, the links to real documentation.

Each rule is anchored to a whole line and matched case-insensitively, so a
sentence that merely mentions "comments" survives.
"""
import json, re, sys
from pathlib import Path

# A line that is pure call-to-action for the host community.
DROP_LINE = re.compile(r"""^\s*(?:[*_#>\\\s-]*)(?:
      now\s+mark\s+this\s+complete
    | mark\s+this\s+(?:lesson\s+)?complete
    | share\s+(?:with\s+us\s+)?.{0,40}\bin\s+the\s+comments\b.*
    | (?:tell|let)\s+us\s+.{0,40}\bin\s+the\s+comments\b.*
    | drop\s+(?:a\s+|your\s+).{0,30}\bin\s+the\s+comments\b.*
    | comment\s+below.*
    | post\s+(?:your|any)\s+questions?\s+(?:in|below).*
    | (?:join|see)\s+us\s+(?:live|next\s+week).*
    | (?:register|rsvp)\s+(?:here|now|for).*
    | add\s+(?:it|this)\s+to\s+your\s+calendar.*
    | don.?t\s+forget\s+to\s+(?:mark|comment|share|rsvp).*
    | watch\s+the\s+replay\s+(?:here|below)\s*[.:]?
    | view\s+the\s+full\s+presentation\s+deck\s+below\s*[.:]?
    | download\s+the\s+slides\s+from\s+the\s+session\s+above\s*[.:]?
    | check\s+out\s+the\s+deck\s*[.:]?
    | if\s+you\s+missed\s+it,?\s+here.?s\s+what\s+came\s+up\s*[.:]?
    | \[?video\s*\d*\]?\s*\(?https?://video\.mn\.co\S*\)?\s*(?:\(transcript\s+below\))?
    | transcript\s+below
    )\s*[*_:.]*\s*$""",
    re.IGNORECASE | re.VERBOSE)

# Headings that only label community furniture.
DROP_HEADING = re.compile(
    r"^\s*#{1,6}\s*\**\s*(?:call\s+transcript|transcript|share\s+your\s+\w+|"
    r"view\s+the\s+full\s+presentation\s+deck\s+below|check\s+out\s+the\s+deck|"
    r"download\s+the\s+slides.*)\s*\**\s*$",
    re.IGNORECASE)


def attachments(text, page):
    """The scrape's file links are relative paths that resolve to nothing.

    The attachment itself lives on the lesson page in Mighty Networks, so
    point there and keep the filename as the label; with no page to point
    at, leave the name as plain text rather than a link that 404s.
    """
    def fix(m):
        label = m.group(1).strip()
        label = re.sub(r"^File:\s*", "", label).replace("\\_", "_").strip()
        return f"[{label}]({page})" if page else label

    text = re.sub(r"\[([^\]]*)\]\(\.\./[^)]*\)", fix, text)

    # A video.mn.co asset URL is the media file, which refuses to play
    # outside Mighty Networks. The lesson page it belongs to does play.
    if page:
        text = re.sub(
            r"^[ \t]*(?:[*_>-]*[ \t]*)?Video file:[ \t]*https?://video\.mn\.co/\S*[ \t]*$",
            f"Watch on Mighty Networks: {page}",
            text,
            flags=re.M | re.IGNORECASE,
        )
        text = re.sub(r"\]\(https?://video\.mn\.co/[^)]*\)", f"]({page})", text)
    return text


def tidy(text):
    if not text:
        return text

    # The scrape escapes markdown that was never meant to be literal.
    text = text.replace("\\*", "*").replace("\\_", "_").replace("\\#", "#")
    # "##### **** Help Centre Articles" -> "##### Help Centre Articles"
    # A heading already renders bold, so every ** inside one is redundant.
    # Stripping only the opening run left the closer behind and broke the
    # markup, so take them all, including the empty "##### ****" case.
    text = re.sub(
        r"^(#{1,6})[ \t]*(.*)$",
        lambda m: f"{m.group(1)} {m.group(2).replace('**', '').strip()}".rstrip(),
        text,
        flags=re.M,
    )
    # Empty emphasis — four or more stars with nothing between them. The
    # earlier rule here also matched the CLOSING half of every **bold**,
    # leaving the marker unclosed and the markdown broken from there on.
    text = re.sub(r"\*{4,}", "", text)

    kept = [l for l in text.split("\n")
            if not DROP_LINE.match(l) and not DROP_HEADING.match(l)]
    text = "\n".join(kept)

    # A heading with nothing under it is furniture too. But a heading
    # followed by a DEEPER heading owns that subsection, so it stays —
    # dropping it decapitated real sections ("The 30-Day Welcome Formula"
    # above its "Day 0 / Day 1" steps). Only a heading trailed by a sibling
    # or shallower heading is a label with nothing of its own.
    lines, out = text.split("\n"), []
    for i, line in enumerate(lines):
        here = re.match(r"^\s*(#{1,6})\s+\S", line)
        if here:
            rest = [x for x in lines[i + 1:] if x.strip()]
            if not rest:
                continue
            nxt = re.match(r"^\s*(#{1,6})\s+", rest[0])
            if nxt and len(nxt.group(1)) <= len(here.group(1)):
                continue
        out.append(line)

    return re.sub(r"\n{3,}", "\n\n", "\n".join(out)).strip()


def best_video(lesson):
    """Prefer the page the video lives on; a raw media file is not a page."""
    url = lesson.get("videoUrl") or ""
    if "video.mn.co" in url or url.endswith((".mp4", ".m3u8")):
        return lesson.get("sourceUrl") or None
    return url or None


if __name__ == "__main__":
    src, out = sys.argv[1], sys.argv[2]
    pkgs = json.loads(Path(src).read_text())
    before = after = 0
    rewired = 0
    for p in pkgs:
        for l in p["lessons"]:
            c = l.get("content") or ""
            before += len(c.split())
            page = l.get("sourceUrl") or ""
            l["content"] = attachments(tidy(c) or "", page) or None
            after += len((l["content"] or "").split())
            l["transcript"] = attachments(tidy(l.get("transcript") or ""), page)
            v = best_video(l)
            if v != l.get("videoUrl"):
                rewired += 1
            l["videoUrl"] = v
    Path(out).write_text(json.dumps(pkgs))
    print(f"{Path(out).name}: lesson text {before:,} -> {after:,} words "
          f"({100*(before-after)/max(before,1):.1f}% removed), "
          f"{rewired} video links repointed")
