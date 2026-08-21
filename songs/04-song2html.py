#!/usr/bin/env python3
"""
song2html.py

Convert a chord sheet (plain-text .txt or ChordPro-style .crd) into HTML
suitable for the lyrics viewer, and also emit a companion .json metadata file.

Plain-text (.txt) format
------------------------
  - First non-blank line          → song title
  - Lines before the first [Section] → notes (rendered as-is)
  - [Section Title]               → starts a new section
  - Chord line + following lyric line → paired chord/lyric block
  - Lines starting with |         → bar lines
  - Blank lines                   → vertical spacers

ChordPro-style (.crd) format
----------------------------
  - First non-blank line          → song title
  - {soh} ... {eoh}               → section titled [highlight]
    (the directive lines themselves are discarded)
  - {soc} ... {eoc}               → section titled [Chorus]
    (the directive lines themselves are discarded)
  - [Section Title]               → starts a new section
  - Lines containing [Chord]      → split into aligned chords + lyrics
  - Lines without brackets        → treated as lyric-only lines
  - Blank lines                   → vertical spacers
  - Lines starting with |         → bar lines

Parsing and rendering are kept strictly separate.  Both parsers produce the
same Song data model; only the HTML renderer is shared.
"""

VERSION = "0.9"

import json
import os
import re
import sys
from dataclasses import dataclass, field
from typing import List, Optional, Tuple, Union


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class ChordLyricLine:
    """A chord line paired with its lyric line. Spacing is preserved exactly."""
    chords: str
    lyrics: str


@dataclass
class BarLine:
    """A line that starts with '|' (rehearsal marks, N.C., etc.)."""
    text: str


@dataclass
class BlankLine:
    """An empty line used for vertical spacing."""
    pass


SectionItem = Union[ChordLyricLine, BarLine, BlankLine]


@dataclass
class Section:
    title: str
    items: List[SectionItem] = field(default_factory=list)


@dataclass
class Song:
    title: str = ""
    notes: List[str] = field(default_factory=list)
    sections: List[Section] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def is_blank(line: str) -> bool:
    return line.strip() == ""


# Words that indicate a real section label rather than a lone chord.
_SECTION_KEYWORDS = {
    "verse", "chorus", "intro", "bridge", "outro", "instrumental",
    "solo", "pre-chorus", "prechorus", "coda", "tag", "ending",
    "highlight", "interlude", "breakdown",
}


def is_section_header(line: str) -> bool:
    """
    True for lines that are exactly [Something] *and* look like a section
    label (contain a space or a known keyword).  Pure single-chord lines
    such as [D] or [(Fm7)] are *not* treated as headers.
    """
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
    """True for ChordPro-style {tag} lines we recognise."""
    s = line.strip().lower()
    return s in ("{soh}", "{eoh}", "{soc}", "{eoc}")


def read_lines(filename: str) -> List[str]:
    """Read a file and return its lines (newlines kept)."""
    with open(filename, "r", encoding="utf-8") as f:
        return f.readlines()


def slugify_filename(name: str) -> str:
    """Replace spaces with underscores; leave other characters alone."""
    return name.replace(" ", "_")


# ---------------------------------------------------------------------------
# Plain-text (.txt) parser
# ---------------------------------------------------------------------------

def parse_txt(lines: List[str]) -> Song:
    """
    Parse plain-text chord-sheet lines into a Song object.
    """
    song = Song()
    current_section: Optional[Section] = None
    i = 0

    while i < len(lines):
        line = lines[i].rstrip()
        i += 1
        next_line = lines[i].rstrip() if i < len(lines) else None

        # First non-blank line → title
        if song.title == "" and not is_blank(line):
            song.title = line
            continue

        # Section header
        if is_section_header(line):
            current_section = Section(title=line)
            song.sections.append(current_section)
            continue

        # Notes before any section
        if current_section is None:
            song.notes.append(line)
            continue

        # Blank → spacer
        if is_blank(line):
            current_section.items.append(BlankLine())
            continue

        # Chord + lyric pair
        if (
            next_line is not None
            and not is_blank(line)
            and not is_blank(next_line)
            and not is_section_header(next_line)
            and not is_bar_line(next_line)
            and not is_bar_line(line)
        ):
            current_section.items.append(
                ChordLyricLine(chords=line, lyrics=next_line)
            )
            i += 1
            continue

        # Bar / rehearsal line
        if is_bar_line(line):
            current_section.items.append(BarLine(text=line))
            continue

        # Lone non-blank line (no pair partner).
        # Treat as a chord-only line when it looks chord-like, otherwise
        # as a lyric-only line.  This lets pure chord progressions and
        # lyric continuations survive when a .txt was produced by crd2txt.
        if not is_blank(line):
            # Heuristic: if the line contains mostly uppercase / chord-ish
            # characters and little lowercase prose, put it in the chords slot.
            letters = [c for c in line if c.isalpha()]
            upper_ratio = (
                sum(1 for c in letters if c.isupper()) / len(letters)
                if letters else 0
            )
            if upper_ratio > 0.6:
                current_section.items.append(
                    ChordLyricLine(chords=line, lyrics="")
                )
            else:
                current_section.items.append(
                    ChordLyricLine(chords="", lyrics=line)
                )

    return song


# ---------------------------------------------------------------------------
# ChordPro (.crd) parser
# ---------------------------------------------------------------------------

_CHORD_RE = re.compile(r"\[([^\]]*)\]")


def chordpro_line_to_pair(line: str) -> ChordLyricLine:
    """
    Convert a single ChordPro line into an aligned (chords, lyrics) pair.

    Mixed example:
        "[D]Comes a time, When your [F#m]driftin’"
    →   chords = "D                    F#m"
        lyrics = "Comes a time, When your driftin’"

    Pure-chord example:
        "[(Fm7)]   [D]   x2"
    →   chords = "(Fm7)   D"
        lyrics = "x2"
    """
    if "[" not in line:
        return ChordLyricLine(chords="", lyrics=line)

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
        return ChordLyricLine(chords="", lyrics=lyric_str)

    # Detect "mostly pure chord" lines: after removing brackets the remaining
    # non-whitespace is very short (typical annotations such as "x2", "(x2)").
    remaining = lyric_str.strip()
    is_pure_chord_line = len(remaining) <= 4

    if is_pure_chord_line:
        # Rebuild chords while preserving the original spacing that lived
        # between the bracket pairs.
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
                # annotation characters – they go into lyrics, skip here
                i += 1
        chord_str = "".join(parts).rstrip()
        return ChordLyricLine(chords=chord_str, lyrics=remaining)

    # Normal mixed lyric+chord line: place each chord at its column in the
    # cleaned lyrics so the two strings align under a monospace font.
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

    chord_str = "".join(ch_chars).rstrip()
    return ChordLyricLine(chords=chord_str, lyrics=lyric_str)


def parse_chordpro(lines: List[str]) -> Song:
    """
    Parse a ChordPro-style .crd file into the common Song model.

    Directives:
      {soh}  → start a section titled [highlight]
      {eoh}  → discarded
      {soc}  → start a section titled [Chorus]
      {eoc}  → discarded
    """
    song = Song()
    current_section: Optional[Section] = None

    for raw in lines:
        line = raw.rstrip("\n")  # keep trailing spaces if any, drop only newline

        # Title
        if song.title == "" and not is_blank(line) and not is_directive(line):
            song.title = line.strip()  # titles are usually clean
            continue

        # Directives – open a special section or just ignore the close tag
        stripped = line.strip().lower()
        if stripped == "{soh}":
            current_section = Section(title="[highlight]")
            song.sections.append(current_section)
            continue
        if stripped == "{soc}":
            current_section = Section(title="[Chorus]")
            song.sections.append(current_section)
            continue
        if stripped in ("{eoh}", "{eoc}"):
            # simply discard the line (section stays open until next header)
            continue

        # Ordinary section header [Verse 1] etc.
        if is_section_header(line):
            current_section = Section(title=line.strip())
            song.sections.append(current_section)
            continue

        # Notes before the first section
        if current_section is None:
            if not is_blank(line):
                song.notes.append(line)
            continue

        # Blank line
        if is_blank(line):
            current_section.items.append(BlankLine())
            continue

        # Bar line
        if is_bar_line(line):
            current_section.items.append(BarLine(text=line))
            continue

        # Everything else: turn into a ChordLyricLine
        # (handles both pure-chord lines and mixed [chord]lyric lines)
        pair = chordpro_line_to_pair(line)
        current_section.items.append(pair)

    return song


# ---------------------------------------------------------------------------
# HTML helpers & rendering (unchanged from the TXT-only version)
# ---------------------------------------------------------------------------

def format_chords(text: str) -> str:
    """Replace # and b with proper accidental symbols (only on chord lines)."""
    text = text.replace("#", '<span class="accidental">♯</span>')
    text = text.replace("b", '<span class="accidental">♭</span>')
    return text


def render_burger_menu(f) -> None:
    print('            <nav id="burger-menu">', file=f)
    print(file=f)

    print('                <div class="menu-section">', file=f)
    print('                    <h3>Theme</h3>', file=f)
    print(file=f)

    print('  <label class="theme-option default-theme-preview" for="theme-default">', file=f)
    print('      <input type="radio" name="theme" id="theme-default" value="default" checked>', file=f)
    print('      Default', file=f)
    print('  </label>', file=f)

    print('  <label class="theme-option light-theme-preview" for="theme-light">', file=f)
    print('      <input type="radio" name="theme" id="theme-light" value="light">', file=f)
    print('      Light', file=f)
    print('    </label>', file=f)

    print('  <label class="theme-option dark-theme-preview" for="theme-dark">', file=f)
    print('      <input type="radio" name="theme" id="theme-dark" value="dark">', file=f)
    print('      Dark', file=f)
    print('    </label>', file=f)

    print('                </div>', file=f)
    print(file=f)

    print('                <div class="menu-section">', file=f)
    print('                </div>', file=f)
    print(file=f)

    print('                <div class="menu-section">', file=f)
    print('                    <h3>links</h3>', file=f)
    print('                    <a href="../setlists.html">Song Lists</a>', file=f)
    print('                    <a href="../settings.html">Settings</a>', file=f)
    print('                </div>', file=f)
    print(file=f)

    print('            </nav>', file=f)
    print(file=f)


def render_header(f, song: Song) -> None:
    print("        <header>", file=f)
    print(file=f)

    print('            <nav id="navbar">', file=f)
    print(file=f)
    print('                <a class="prev-song" href="#">◀</a>', file=f)
    print('                <a id="menu-button" href="#">☰</a>', file=f)
    print(f'                <h1 class="song-title">{song.title}</h1>', file=f)
    print('                <a class="next-song" href="#">▶</a>', file=f)
    print(file=f)
    print("            </nav>", file=f)
    print(file=f)

    render_burger_menu(f)

    print("        </header>", file=f)
    print(file=f)

    print('            <div id="song-controls">', file=f)
    print(file=f)
    print('                <button id="tempo-button">', file=f)
    print('          <span class="beat-led"></span>', file=f)
    print('          <span class="beat-led"></span>', file=f)
    print('          <span class="beat-led"></span>', file=f)
    print('          <span class="beat-led"></span>', file=f)
    print('                        </button>', file=f)
    print(file=f)
    print('                <span id="tempo-status"></span>', file=f)
    print('            </div>', file=f)
    print(file=f)


def render_notes(f, song: Song) -> None:
    if not song.notes:
        return

    print('            <section class="song-notes">', file=f)
    print(file=f)
    for note in song.notes:
        print(f"                {note}", file=f)
    print(file=f)
    print("            </section>", file=f)
    print(file=f)


def render_line(f, item: SectionItem, line_number: int) -> int:
    """Render a single section item. Returns the next line number."""
    if isinstance(item, ChordLyricLine):
        print('                <div class="chord-lyric">', file=f)
        print(f'                    <div class="chords">{format_chords(item.chords)}</div>', file=f)
        print(
            f'                    <div class="lyrics" id="line-{line_number}" '
            f'data-line="{line_number}">{item.lyrics}</div>',
            file=f,
        )
        print('                </div>', file=f)
        print(file=f)
        return line_number + 1

    if isinstance(item, BarLine):
        print(f'                <div class="bar-line">{item.text}</div>', file=f)
        print(file=f)
        return line_number

    if isinstance(item, BlankLine):
        print('                <div class="blank-line"></div>', file=f)
        print(file=f)
        return line_number

    return line_number


def render_section(f, section: Section, number: int, line_number: int) -> int:
    print(f'            <section class="song-section" id="section-{number}">', file=f)
    print(f'                <h2>{section.title}</h2>', file=f)

    for item in section.items:
        line_number = render_line(f, item, line_number)

    print("            </section>", file=f)
    print(file=f)
    return line_number


def render_main(f, song: Song) -> None:
    print("        <main>", file=f)
    print(file=f)

    render_notes(f, song)

    line_number = 1
    for number, section in enumerate(song.sections, start=1):
        line_number = render_section(f, section, number, line_number)

    print("        </main>", file=f)
    print(file=f)


def render_footer(f) -> None:
    print("        <footer>", file=f)
    print(file=f)
    print('            <nav id="footerbar">', file=f)
    print(file=f)
    print('                <a class="prev-song-footer" href="#">◀</a>', file=f)
    print(
        '                <a id="song-lists" href="../setlists.html">'
        'Song Lists</a>',
        file=f,
    )
    print('                <a class="next-song-footer" href="#">▶</a>', file=f)
    print(file=f)
    print("            </nav>", file=f)
    print(file=f)
    print("        </footer>", file=f)
    print(file=f)


def render_html(song: Song, filename: str) -> None:
    """Write the complete HTML document for the given Song."""
    with open(filename, "w", encoding="utf-8") as f:
        print("<!DOCTYPE html>", file=f)
        print('<html lang="en">', file=f)
        print("<head>", file=f)
        print('    <meta charset="utf-8">', file=f)
        print('    <meta name="viewport" content="width=device-width, initial-scale=1">', file=f)
        print('    <meta name="generator" content="song2html">', file=f)
        print(f'    <meta name="version" content="{VERSION}">', file=f)
        print('    <meta name="description" content="generate html from plain txt song files">', file=f)
        print(f"    <title>{song.title}</title>", file=f)
        print('    <link rel="stylesheet" href="../assets/lyrics.css">', file=f)
        print('    <script defer src="../assets/beat.js"></script>', file=f)
        print('    <script defer src="../assets/common.js"></script>', file=f)
        print('    <script defer src="../assets/lyrics.js"></script>', file=f)
        print("</head>", file=f)
        print('<body class="default-theme">', file=f)
        print(file=f)

        print('    <div id="tempo-frame">', file=f)
        print(file=f)
        print('        <div id="song-container">', file=f)
        print(file=f)
        print('            <div id="app">', file=f)

        render_header(f, song)
        render_main(f, song)
        render_footer(f)

        print("            </div>", file=f)
        print(file=f)
        print("        </div>", file=f)
        print(file=f)
        print("    </div>", file=f)
        print('    <div id="notes-editor-container"></div>', file=f)

        print("</body>", file=f)
        print("</html>", file=f)


# ---------------------------------------------------------------------------
# JSON metadata
# ---------------------------------------------------------------------------

def write_song_json(song: Song, json_path: str) -> None:
    """
    Write a companion JSON file based on the supplied template structure.
    "id" and "title" are set to the song title; everything else keeps
    the template defaults.
    """
    data = {
        "song": {
            "id": song.title,
            "title": song.title,
            "artist": "",
            "version": "1.0",
        },
        "tempo": {
            "bpm": 480,
            "timeSignature": "4/4",
            "countInBars": 4,
        },
        "songNotes": [
            "notes",
        ],
        "sections": {
            "section-1": [
                "section-1 notes",
            ]
        },
        "inline": {
            "line-1": [
                "line-1 notes"
            ]
        },
    }

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
        f.write("\n")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    if len(sys.argv) != 2:
        print(f"Usage: {os.path.basename(sys.argv[0])} song.txt|.crd")
        sys.exit(1)

    filename = sys.argv[1]

    if not os.path.isfile(filename):
        print(f'Error: "{filename}" not found.')
        sys.exit(1)

    lines = read_lines(filename)
    ext = os.path.splitext(filename)[1].lower()

    if ext in (".crd", ".cho", ".chordpro"):
        song = parse_chordpro(lines)
    else:
        # default to the original plain-text parser
        song = parse_txt(lines)

    # Build output names: spaces → underscores, same directory as input
    base = os.path.splitext(os.path.basename(filename))[0]
    safe_base = slugify_filename(base)
    out_dir = os.path.dirname(os.path.abspath(filename)) or "."

    html_path = os.path.join(out_dir, safe_base + ".html")
    json_path = os.path.join(out_dir, safe_base + ".json")

    render_html(song, html_path)
    write_song_json(song, json_path)

    print(f"Created {html_path}")
    print(f"Created {json_path}")
    print()
    print(song.title)


if __name__ == "__main__":
    main()
