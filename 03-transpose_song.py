#!/usr/bin/env python3
"""
Transpose a Song2HTML/plain-text song file.

Usage:
    ./transpose_song.py

The script asks for:
    1. Input filename, with TAB completion
    2. Transposition in semitones, e.g. 2, -1, +5

Output:
    original-filename.t.txt

Example:
    After Midnight.txt -> After Midnight.txt.t.txt
"""

import glob
import os
import re
import readline
import sys
from pathlib import Path


# Chromatic scale, using sharps for output.
CHROMATIC = [
    "C", "C#", "D", "D#", "E", "F",
    "F#", "G", "G#", "A", "A#", "B"
]

NOTE_TO_INDEX = {note: i for i, note in enumerate(CHROMATIC)}

# Also accept flats in input.
FLAT_TO_SHARP = {
    "Db": "C#",
    "Eb": "D#",
    "Gb": "F#",
    "Ab": "G#",
    "Bb": "A#",
}

# Chord token:
#   D, F#, Bb, G/D, C#m7, Asus4, D/F# etc.
#
# The suffix is deliberately permissive enough for common guitar chords,
# while stopping at whitespace/punctuation that is not part of a chord.
CHORD_RE = re.compile(
    r"(?<![A-Za-z0-9])"
    r"(?P<root>[A-G](?:#|b)?)"
    r"(?P<suffix>"
    r"(?:maj|min|m|dim|aug|sus|add|no|"
    r"[0-9]+|[#b]|"
    r"\([^)]*\))*"
    r")"
    r"(?P<bass>/[A-G](?:#|b)?)?"
    r"(?![A-Za-z0-9])"
)


def normalise_note(note):
    """Convert a note name to a sharp-based chromatic note."""
    if note in FLAT_TO_SHARP:
        return FLAT_TO_SHARP[note]
    return note


def transpose_note(note, semitones):
    """Transpose one note by the requested number of semitones."""
    note = normalise_note(note)
    index = NOTE_TO_INDEX[note]
    return CHROMATIC[(index + semitones) % 12]


def transpose_chord(match, semitones):
    """Transpose the root and optional slash-bass of one chord token."""
    root = match.group("root")
    suffix = match.group("suffix") or ""
    bass = match.group("bass") or ""

    new_root = transpose_note(root, semitones)

    if bass:
        bass_note = bass[1:]  # Remove slash
        new_bass = "/" + transpose_note(bass_note, semitones)
    else:
        new_bass = ""

    return new_root + suffix + new_bass


def transpose_line(line, semitones):
    """Transpose chord-looking tokens while preserving all other text."""
    return CHORD_RE.sub(
        lambda match: transpose_chord(match, semitones),
        line
    )


def filename_completer(text, state):
    """Readline TAB completion for files in the current directory."""
    matches = glob.glob(text + "*")
    matches = [m for m in matches if os.path.isfile(m)]
    matches.sort()

    if state < len(matches):
        return matches[state]
    return None


def setup_readline():
    readline.set_completer(filename_completer)
    readline.parse_and_bind("tab: complete")


def ask_for_filename():
    while True:
        filename = input("Input filename [TAB to complete]: ").strip()

        if not filename:
            print("Please enter a filename.")
            continue

        path = Path(filename)

        if not path.is_file():
            print(f"File not found: {path}")
            continue

        return path


def ask_for_semitones():
    while True:
        value = input("Transpose by semitones (+/-; 0 = copy): ").strip()

        try:
            return int(value)
        except ValueError:
            print("Please enter a whole number, e.g. 2, -1, or +5.")


def main():
    setup_readline()

    try:
        source = ask_for_filename()
        semitones = ask_for_semitones()
    except (KeyboardInterrupt, EOFError):
        print("\nCancelled.")
        return 1

    destination = Path(str(source) + ".t.txt")

    if destination.exists():
        answer = input(
            f"{destination} already exists. Overwrite? [y/N]: "
        ).strip().lower()

        if answer not in ("y", "yes"):
            print("Cancelled; existing file was not changed.")
            return 1

    try:
        text = source.read_text(encoding="utf-8")
        transposed = "".join(
            transpose_line(line, semitones)
            for line in text.splitlines(keepends=True)
        )
        destination.write_text(transposed, encoding="utf-8")
    except OSError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    print(f"Written: {destination}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
