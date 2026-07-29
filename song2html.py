#!/usr/bin/env python3

#
# song2html.py
#
# Convert a plain text chord sheet into HTML.
#
VERSION = "0.7-burger button"



import os
import sys

from dataclasses import dataclass, field

@dataclass
class Pair:
    chord: str
    lyric: str


@dataclass
class Line:
    pairs: list = field(default_factory=list)


@dataclass
class BarLine:
    text: str

@dataclass
class BlankLine:
    pass


# A chord line and its associated lyric line.
# Spacing is preserved exactly as read from the source file.

@dataclass
class ChordLyricLine:
    chords: str
    lyrics: str


@dataclass
class Section:
    title: str
#    ident: str
    items: list = field(default_factory=list)



@dataclass
class Song:
    title: str = ""
    notes: list = field(default_factory=list)
    sections: list = field(default_factory=list)



def read_song(filename):
    """Read the song text file."""

    with open(filename, "r", encoding="utf-8") as f:
        return f.readlines()


def is_blank(line):
    return line.strip() == ""


def is_section_header(line):
    line = line.strip()
    return line.startswith("[") and line.endswith("]")

def render_main(f, song):

    print("        <main>", file=f)
    print(file=f)

    render_notes(f, song)
    line_number = 1

    for number, section in enumerate(song.sections, start=1):
#        render_section(f, section, number)

        line_number = render_section(
            f,
            section,
            number,
            line_number
        )

    print("        </main>", file=f)
    print(file=f)


def render_notes(f, song):

    if not song.notes:
        return

    print('            <section class="song-notes">', file=f)
    print(file=f)

    for note in song.notes:
        print(f"                {note}", file=f)

    print(file=f)
    print("            </section>", file=f)
    print(file=f)


def format_chords(text):

    text = text.replace(
        "#",
        '<span class="accidental">♯</span>'
    )

    text = text.replace(
        "b",
        '<span class="accidental">♭</span>'
    )


    return text

def render_line(f, item, line_number):

    if isinstance(item, ChordLyricLine):

        print('                <div class="chord-lyric">', file=f)
        print(f'                    <div class="chords">{format_chords(item.chords)}</div>', file=f)
        print(f'                    <div class="lyrics" id="line-{line_number}" data-line="{line_number}">{item.lyrics}</div>', file=f)
        print('                </div>', file=f)

        print(file=f)

        return line_number + 1


    if isinstance(item, BarLine):

        print(
            f'                <div class="bar-line">{item.text}</div>',
            file=f
        )

        print(file=f)

        return line_number


    if isinstance(item, BlankLine):

        print(
            '                <div class="blank-line"></div>',
            file=f
        )

        print(file=f)

        return line_number

def render_section(f, section, number, line_number):

    print(
        f'            <section class="song-section" id="section-{number}">',
        file=f
    )

    print(
        f'                <h2>{section.title}</h2>',
        file=f
    )


    for item in section.items:
#        render_line(f, item, 1)
        line_number = render_line(f, item, line_number)

    print("            </section>", file=f)

    print(file=f)
    return line_number


def is_bar_line(line):
    return line.lstrip().startswith("|")

def render_header(f, song):

    print("        <header>", file=f)
    print(file=f)

    print('            <nav id="navbar">', file=f)
    print(file=f)

    print('                <a id="menu-button" href="#">☰</a>', file=f)
#    print('                <a id="menu-button" hidden href="#">☰</a>', file=f)

    print('                <a id="prev-song" href="#">◀</a>', file=f)

    print(
        f'                <h1 class="song-title">{song.title}</h1>',
        file=f
    )

    print('                <a id="next-song" href="#">▶</a>', file=f)
    print(file=f)

    print("            </nav>", file=f)
    print(file=f)

    render_burger_menu(f)


    print("        </header>", file=f)
    print(file=f)


    print('            <div id="song-controls">', file=f)
    print(file=f)

    print('                <button id="tempo-button"></button>', file=f)
    print(file=f)

    print('            </div>', file=f)
    print(file=f)



#def render_header(f, song):
#    print("    <header>", file=f)
#    print(f"        <h1 class=\"song-title\">{song.title}</h1>", file=f)
#    print("    </header>", file=f)
#    print(file=f)

def render_burger_menu(f):

    print('            <nav id="burger-menu">', file=f)
    print(file=f)

    print('                <div class="menu-section">', file=f)
    print('                    <h3>Theme</h3>', file=f)
    print(file=f)

    print('                    <label><input type="radio" name="theme" id="theme-default" checked> Default</label>', file=f)
    print('                    <label><input type="radio" name="theme" id="theme-light"> Light</label>', file=f)
    print('                    <label><input type="radio" name="theme" id="theme-dark"> Dark</label>', file=f)

    print('                </div>', file=f)
    print(file=f)

    print('                <div class="menu-section">', file=f)
    print('                    <h3>Options</h3>', file=f)

    print('                    <label><input type="checkbox" id="invert-theme"> Invert Colours</label>', file=f)
    print('                    <label><input type="checkbox" id="big-tempo"> Big Tempo</label>', file=f)

    print('                </div>', file=f)
    print(file=f)

    print('                <div class="menu-section">', file=f)
    print('                    <h3>links</h3>', file=f)

    print('                    <a href="songlists.html">Song Lists</a>', file=f)
    print('                    <a href="settings.html">Settings</a>', file=f)

    print('                </div>', file=f)
    print(file=f)

    print('            </nav>', file=f)
    print(file=f)



def render_footer(f):

    print("        <footer>", file=f)
    print(file=f)
    print('            <nav id="footerbar">', file=f)
    print(file=f)
    print('                <a id="prev-song-footer" href="#">◀</a>', file=f)
    print(
        '                <a id="song-lists" href="index.html">'
        'Song Lists</a>',
        file=f
    )

    print('                <a id="next-song-footer" href="#">▶</a>', file=f)
    print(file=f)
    print("            </nav>", file=f)
    print(file=f)
    print("        </footer>", file=f)
    print(file=f)



# def make_ident(title):
#    ident = title.strip("[]")
#    ident = ident.replace(" ", "")
#    return ident


def parse_song(lines):

    song = Song()

    current = None
    i = 0

#    for raw in lines:
    while i < len(lines):

        raw = lines[i]

        line = raw.rstrip()

        i += 1
        next_line = None

        if i < len(lines):
            next_line = lines[i].rstrip()
        #
        # First non-blank line is the title.
        #

# bit of debug
#        if next_line is not None:
#
#           print("CURRENT :", repr(line))
#           print("NEXT    :", repr(next_line))
#           print()


        if song.title == "" and not is_blank(line):
            song.title = line
            continue

        #
        # Section heading.
        #

        if is_section_header(line):

            current = Section(
                title=line,
#                ident=make_ident(line)
            )

            song.sections.append(current)

            continue

        #
        # Notes before the first section.
        #


        if current is None:
            song.notes.append(line)
            continue

        if is_blank(line):
            current.items.append(
                BlankLine()
            )
            continue

        if (
            next_line is not None
            and not is_blank(line)
            and not is_blank(next_line)
            and not is_section_header(next_line)
            and not is_bar_line(next_line)
            and not is_bar_line(line)
        ):
            current.items.append(
                ChordLyricLine(
                    chords=line,
                    lyrics=next_line
                )
            )

            i += 1
            continue

        if is_bar_line(line):
            current.items.append(
                BarLine(text=line)
            )
            continue

    return song



def render_html(song, filename):

    with open(filename, "w", encoding="utf-8") as f:

        print("<!DOCTYPE html>", file=f)
        print("<html lang=\"en\">", file=f)
        print("<head>", file=f)
        print("    <meta charset=\"utf-8\">", file=f)
        print("    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">", file=f)

        print(f"    <meta name=\"generator\" content=\"song2html\">", file=f)
        print(f"    <meta name=\"version\" content=\"0.6\">", file=f)

        print(f"    <title>{song.title}</title>", file=f)
        print("    <link rel=\"stylesheet\" href=\"../assets/lyrics.css\">", file=f)
        print("    <script defer src=\"../assets/lyrics.js\"></script>", file=f)
        print("</head>", file=f)
        print("<body class=\"default-theme\">", file=f)
        print(file=f)

        print('    <div id="tempo-frame">', file=f)
        print(file=f)

        print('        <div id="song-container">', file=f)
        print(file=f)

        print("            <div id=\"app\">", file=f)

#        print("        <header>", file=f)
#        print("        </header>", file=f)
#        print()

        render_header(f, song)

#        print("        <main>", file=f)
#        print("        </main>", file=f)
#        print()

        render_main(f, song)

#        print("        <footer>", file=f)
#        print("        </footer>", file=f)

        render_footer(f)

        print("            </div>", file=f)
        print(file=f)
        print("        </div>", file=f)
        print(file=f)
        print("    </div>", file=f)
        print("</body>", file=f)
        print("</html>", file=f)


def main():

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

#    print("Title")
#    print("-----")
    print(song.title)

#    print()

#    print("Notes")
#    print("-----")

#    for note in song.notes:
#        print(note)

#    print()

#    print("Sections")
#    print("--------")


#    for section in song.sections:

#        print(section.title)

#        for item in section.items:

#            if isinstance(item, BarLine):
#                print("   BAR:", item.text)
#            elif isinstance(item, BlankLine):
#               print("   BLANK")
#            elif isinstance(item, ChordLyricLine):
#               print("   CHORDS:", item.chords)
#               print("   LYRICS:", item.lyrics)


if __name__ == "__main__":
    main()
