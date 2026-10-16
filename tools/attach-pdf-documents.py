"""Attach the workshop transcripts that only ever existed as PDFs.

The scrape exported each PDF's text into pdf-text/, but the library parser
only ever read the lesson .md files, so a session whose transcript lived
solely in its PDF arrived in Studiolo with no transcript at all.

Usage: attach_transcripts.py <lib-key> <drop-dir> <lib.json> <out.json>
"""
import json, re, sys
from pathlib import Path

# pdftotext drops the fi/fl ligature instead of expanding it, so a word
# loses those letters: "benefits" arrives as "bene ts". Only rules that
# actually fire on this material are listed, and only where the broken
# form is not itself a word — "ll" is left alone because it is "we'll",
# not a broken "fill", 275 times over.
LIGATURES = {
    r"\bbene ts\b": "benefits", r"\bbene t\b": "benefit",
    r"\bspeci c\b": "specific", r"\bspeci cally\b": "specifically",
    r"\bpro les\b": "profiles", r"\bpro le\b": "profile",
    r"\bcon dence\b": "confidence", r"\bcon rm\b": "confirm",
    r"\bidenti ed\b": "identified", r"\bde nition\b": "definition",
    r"\bsu cient\b": "sufficient", r"\bdi cult\b": "difficult",
    r"\brst\b": "first",
}


def from_pdf_text(raw):
    """Turn one pdftotext dump into something readable."""
    text = raw.replace("\f", "\n\n")           # page breaks
    text = text.replace(" ", " ")
    for pat, word in LIGATURES.items():
        text = re.sub(pat, word, text, flags=re.IGNORECASE)
    text = re.sub(r"^(fi|fl|ffi|ff)$", "", text, flags=re.M)   # orphaned ligature
    text = re.sub(r"[ \t]+$", "", text, flags=re.M)
    text = bullets(text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


# These decks nest their lists by glyph, not by indentation — the PDF
# export flattens every level to column zero. Left as plain lines they
# render as one running paragraph, because markdown folds consecutive
# lines together.
LEVELS = {"\u2605": 0, "\u2606": 0, "\u2022": 0, "\u25cb": 1, "\u25a0": 2, "\u25cf": 3,
          "\u25a1": 2, "\u25aa": 3, "\u25c6": 2, "\u2023": 1, "\u2043": 1}
BULLET = re.compile(r"^\s*([" + "".join(LEVELS) + r"])\s+(.*)$")


def bullets(text):
    out, open_item = [], False
    for line in text.split("\n"):
        m = BULLET.match(line)
        if m:
            depth, body = LEVELS[m.group(1)], m.group(2).strip()
            out.append(f"{'  ' * depth}- {body}")
            open_item = True
        elif not line.strip():
            out.append("")
            open_item = False
        elif open_item:
            # A wrapped continuation of the bullet above it.
            out[-1] += " " + line.strip()
        else:
            out.append(line)
    return "\n".join(out)


MANIFEST = {
    # Standalone documents: written guides and a book that exist nowhere in
    # the scraped lessons. These become lessons of their own, in the course
    # their folder already maps to.
    "new-lesson": [
        ("mighty-premier", "engagement-resources/Falling in Love With Your Ideal Member Understanding Life And Transitions Stages.pdf.txt",
         "mighty-premier-engagement-resources", "Falling in Love With Your Ideal Member: Life and Transition Stages", "Guides"),
        ("mighty-premier", "host-to-host-what-s-working/A Day in the Life of a Mighty Host.pdf.txt",
         "mighty-premier-host-to-host-what-s-working", "A Day in the Life of a Mighty Host", "Guides"),
        ("mighty-premier", "market-your-membership/The No-Sell Sell Category Pirates.pdf.txt",
         "mighty-premier-market-your-membership", 'The "No-Sell" Sell (Category Pirates)', "Guides"),
    ],
    # Slide decks for a session whose lesson is already here. The deck is
    # appended to that lesson rather than duplicating the session.
    "append-slides": [
        ("mighty-premier", "engagement-resources/Fall_in_love_With_Your_Ideal_Member-_May_2024.pdf.txt",
         "How to Fall in Love With Your Ideal Member"),
        ("mighty-premier", "market-your-membership/May 2023 Mighty Pro Workshop - How to Grow Your Membership.pdf.txt",
         "Workshop: How to Grow Your Membership with Marketing Funnels"),
        ("path-to-pro", "events-replays/January Path-to-Pro Workshop Slides.pdf.txt",
         "[Replay] How to Build Your Growth Plan"),
        ("path-to-pro", "events-replays/May Path-to-Pro Workshop Slides.pdf.txt",
         "Email Launch Workshop"),
    ],
}

# Everything else in pdf-text/ is a second rendering of a transcript the
# lesson already carries (median 56% vocabulary overlap, the closest pairs
# 0.84-0.90), so importing it would only duplicate the session.


def slug(title):
    out = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return out[:60]


def main(lib_key, drop, lib_path, out_path):
    pkgs = json.loads(Path(lib_path).read_text())
    by_course = {p["course"]["externalId"]: p for p in pkgs}
    by_title = {l["title"]: l for p in pkgs for l in p["lessons"]}

    added = appended = 0
    for key, rel, course_id, title, section in MANIFEST["new-lesson"]:
        if key != lib_key:
            continue
        pkg = by_course.get(course_id)
        if pkg is None:
            print(f"  ! no course {course_id}")
            continue
        body = from_pdf_text(Path(drop, key, "pdf-text", rel).read_text(errors="ignore"))
        ext = f"{course_id}-doc-{slug(title)}"
        if ext in {l["externalId"] for l in pkg["lessons"]}:
            continue
        pkg["lessons"].append({
            "externalId": ext,
            "title": title,
            "section": section,
            "sectionOrder": 99,
            "order": len(pkg["lessons"]),
            "sourceKind": "post",
            "videoUrl": None,
            "sourceUrl": pkg["course"].get("sourceUrl"),
            "transcript": "",
            "content": body,
            "topics": [],
            "durationMinutes": max(1, round(len(body.split()) / 200)),
        })
        added += 1

    for key, rel, lesson_title in MANIFEST["append-slides"]:
        if key != lib_key:
            continue
        lesson = by_title.get(lesson_title)
        if lesson is None:
            print(f"  ! no lesson titled {lesson_title!r}")
            continue
        body = from_pdf_text(Path(drop, key, "pdf-text", rel).read_text(errors="ignore"))
        if "### Slides from this session" in (lesson.get("content") or ""):
            continue
        lesson["content"] = ((lesson.get("content") or "")
                             + f"\n\n---\n\n### Slides from this session\n\n{body}").strip()
        appended += 1

    Path(out_path).write_text(json.dumps(pkgs))
    print(f"{Path(out_path).name}: {added} documents added as lessons, "
          f"{appended} slide decks appended")


if __name__ == "__main__":
    main(*sys.argv[1:5])
