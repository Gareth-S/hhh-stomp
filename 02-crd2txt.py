#!/usr/bin/env python3
"""
crd2txt.py

Convert a ChordPro-style .crd file into a plain-text chord sheet
that song2html.py's TXT parser understands.

Rules applied
-------------
  - First non-blank line          → title
  - {soh} … {eoh}                 → [highlight] section
    (the directive lines themselves are discarded)
  - {soc} … {eoc}                 → [Chorus] section
    (the directive lines themselves are discarded)
  - [Section Title]               → kept as-is
  - Lines containing [Chord]      → split into an aligned chords line
                                    followed by a lyrics line
  - Pure chord lines              → single chords line
  - Pure text lines               → single lyrics line
  - Blank lines                   → preserved
  - Lines starting with |         → preserved as bar lines

Usage
-----
  crd2txt.py song.crd          # writes song.txt  (spaces → underscores)
  crd2txt.py song.crd out.txt  # explicit output name
"""

VERSION = "1.0"

import os
import re
import sys
from typing import List, Optional, Tuple


# ---------------------------------------------------------------------------
# Helpers (mirrors the logic in song2html.py)
# ---------------------------------------------------------------------------

_SECTION_KEYWORDS = {
    "verse", "chorus", "intro", "bridge", "outro", "instrumental",
    "solo", "pre-chorus", "prechorus", "coda", "tag", "ending",
    "highlight", "interlude", "breakdown",
}


def is_blank(line: str) -> bool:
    return line.strip() == ""


def is_section_header(line: str) -> bool:
    m = re.match(r"^\[([^\[\]]+)\]$", line.strip())
    if not m:
        return False
    content = m.group(1).strip()
    lower = content.lower()
    if " " in content:
        return True
    return any(kw in lower for kw in _SECTION_KEYWORDS)


def is_bar_line(line: str) -> bool:
    return line.lstrip().startswith("|")


def is_directive(line: str) -> bool:
    s = line.strip().lower()
    return s in ("{soh}", "{eoh}", "{soc}", "{eoc}")


def slugify(name: str) -> str:
    return name.replace(" ", "_")


def chordpro_line_to_pair(line: str) -> Tuple[str, str]:
    """
    Return (chords, lyrics) for a ChordPro line.

    Mixed:   "[D]Hello [G]world"  →  ("D      G", "Hello world")
    Pure:    "[(Fm7)]   [D]  x2"  →  ("(Fm7)   D", "x2")
    None:    "just text"          →  ("", "just text")
    """
    if "[" not in line:
        return "", line

    chord_positions: List[Tuple[int, str]] = []
    lyrics_chars: List[str] = []
    i = 0
    n = len(line)

    while i < n:
        if line[i] == "[":
            end = line.find("]", i + 1)
            if end == -1:
                lyrics_chars.append(line[i:])
                break
            chord = line[i + 1 : end]
            pos = len(lyrics_chars)
            chord_positions.append((pos, chord))
            i = end + 1
        else:
            lyrics_chars.append(line[i])
            i += 1

    lyric_str = "".join(lyrics_chars)

    if not chord_positions:
        return "", lyric_str

    remaining = lyric_str.strip()
    is_pure = len(remaining) <= 4

    if is_pure:
        parts: List[str] = []
        i = 0
        while i < n:
            if line[i] == "[":
                end = line.find("]", i + 1)
                if end == -1:
                    break
                parts.append(line[i + 1 : end])
                i = end + 1
            elif line[i].isspace():
                j = i
                while j < n and line[j].isspace():
                    j += 1
                parts.append(line[i:j])
                i = j
            else:
                i += 1
        return "".join(parts).rstrip(), remaining

    # Mixed line – place chords at lyric columns
    max_needed = max(
        (pos + len(ch) for pos, ch in chord_positions),
        default=0,
    )
    max_needed = max(max_needed, len(lyric_str))
    ch_chars = [" "] * max_needed
    for pos, ch in chord_positions:
        for k, c in enumerate(ch):
            if pos + k < len(ch_chars):
                ch_chars[pos + k] = c
    return "".join(ch_chars).rstrip(), lyric_str


# ---------------------------------------------------------------------------
# Conversion
# ---------------------------------------------------------------------------

def convert_crd_to_txt(lines: List[str]) -> List[str]:
    """
    Transform ChordPro lines into the plain-text format expected by
    song2html's TXT parser.  Returns a list of output lines (no newlines).
    """
    out: List[str] = []
    title_done = False
    current_section: Optional[str] = None  # just for tracking; we emit headers as we go

    for raw in lines:
        line = raw.rstrip("\n")

        # Title
        if not title_done and not is_blank(line) and not is_directive(line):
            out.append(line.strip())
            out.append("")  # blank after title looks nicer
            title_done = True
            continue

        # Directives
        stripped = line.strip().lower()
        if stripped == "{soh}":
            out.append("[highlight]")
            current_section = "[highlight]"
            continue
        if stripped == "{soc}":
            out.append("[Chorus]")
            current_section = "[Chorus]"
            continue
        if stripped in ("{eoh}", "{eoc}"):
            continue  # discard

        # Section header
        if is_section_header(line):
            out.append(line.strip())
            current_section = line.strip()
            continue

        # Blank
        if is_blank(line):
            out.append("")
            continue

        # Bar line – keep as-is
        if is_bar_line(line):
            out.append(line)
            continue

        # Content line → possible chord/lyric pair
        chords, lyrics = chordpro_line_to_pair(line)

        if chords and lyrics:
            out.append(chords)
            out.append(lyrics)
        elif chords:
            # pure chord line – emit just the chords
            # (song2html TXT parser will keep it if we also accept lone lines,
            #  otherwise it still appears as a readable chord progression)
            out.append(chords)
        elif lyrics:
            # pure text
            out.append(lyrics)
        # else: completely empty after processing – skip

    # Clean up trailing blanks
    while out and out[-1] == "":
        out.pop()

    return out


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    if len(sys.argv) not in (2, 3):
        print(f"Usage: {os.path.basename(sys.argv[0])} song.crd [output.txt]")
        sys.exit(1)

    src = sys.argv[1]
    if not os.path.isfile(src):
        print(f'Error: "{src}" not found.')
        sys.exit(1)

    if len(sys.argv) == 3:
        dst = sys.argv[2]
    else:
        base = os.path.splitext(os.path.basename(src))[0]
        safe = slugify(base)
        dst_dir = os.path.dirname(os.path.abspath(src)) or "."
        dst = os.path.join(dst_dir, safe + ".txt")

    with open(src, "r", encoding="utf-8") as f:
        lines = f.readlines()

    txt_lines = convert_crd_to_txt(lines)

    with open(dst, "w", encoding="utf-8") as f:
        for line in txt_lines:
            f.write(line + "\n")

    print(f"Created {dst}")


if __name__ == "__main__":
    main()
