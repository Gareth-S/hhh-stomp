#!/usr/bin/env python3
"""
song2html.py

Convert a plain-text chord sheet into HTML suitable for the lyrics viewer.

The input format is simple:
  - First non-blank line  → song title
  - Lines before the first [Section] → notes (rendered as-is)
  - [Section Title]       → starts a new section
  - Chord line followed by a lyric line → paired chord/lyric block
  - Lines starting with | → bar lines (e.g. | N.C. | or | 1. | etc.)
  - Blank lines           → blank-line spacers

Parsing and rendering are kept strictly separate so that additional
input formats (ChordPro, etc.) can be added later without touching
the HTML generation.
"""

VERSION = "0.8"

import os
import sys
from dataclasses import dataclass, field
from typing import List, Union


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


# Items that can appear inside a section
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
# Parsing helpers
# ---------------------------------------------------------------------------

def is_blank(line: str) -> bool:
    return line.strip() == ""


def is_section_header(line: str) -> bool:
    stripped = line.strip()
    return stripped.startswith("[") and stripped.endswith("]")


def is_bar_line(line: str) -> bool:
    return line.lstrip().startswith("|")


def read_song(filename: str) -> List[str]:
    """Read the song text file and return its lines (including newlines)."""
    with open(filename, "r", encoding="utf-8") as f:
        return f.readlines()


def parse_song(lines: List[str]) -> Song:
    """
    Parse plain-text chord-sheet lines into a Song object.

    This is the only place that understands the TXT format.
    Future formats (ChordPro, etc.) should provide their own
    parse_* function that returns the same Song model.
    """
    song = Song()
    current_section: Section | None = None
    i = 0

    while i < len(lines):
        line = lines[i].rstrip()
        i += 1

        next_line = lines[i].rstrip() if i < len(lines) else None

        # First non-blank line becomes the title
        if song.title == "" and not is_blank(line):
            song.title = line
            continue

        # Section header
        if is_section_header(line):
            current_section = Section(title=line)
            song.sections.append(current_section)
            continue

        # Everything before the first section is treated as notes
        if current_section is None:
            song.notes.append(line)
            continue

        # Blank line → spacer
        if is_blank(line):
            current_section.items.append(BlankLine())
            continue

        # Chord line + lyric line pair
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
            i += 1  # consume the lyric line
            continue

        # Bar / rehearsal line
        if is_bar_line(line):
            current_section.items.append(BarLine(text=line))
            continue

        # Any other non-blank line that didn't match above is currently ignored.
        # (Original behaviour; could be extended later if needed.)

    return song


# ---------------------------------------------------------------------------
# HTML helpers
# ---------------------------------------------------------------------------

def format_chords(text: str) -> str:
    """Replace # and b with proper accidental symbols (applied only to chord lines)."""
    text = text.replace("#", '<span class="accidental">♯</span>')
    text = text.replace("b", '<span class="accidental">♭</span>')
    return text


# ---------------------------------------------------------------------------
# HTML rendering
# ---------------------------------------------------------------------------

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

    # Song controls sit outside <header> (matches original layout)
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
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    if len(sys.argv) != 2:
        print(f"Usage: {os.path.basename(sys.argv[0])} song.txt")
        sys.exit(1)

    filename = sys.argv[1]

    if not os.path.isfile(filename):
        print(f'Error: "{filename}" not found.')
        sys.exit(1)

    lines = read_song(filename)
    song = parse_song(lines)

    html_filename = os.path.splitext(filename)[0] + ".html"
    render_html(song, html_filename)

    print(f"Created {html_filename}")
    print()
    print(song.title)


if __name__ == "__main__":
    main()
