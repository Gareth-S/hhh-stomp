#!/bin/bash

# Build the files used by the PWA update system and the song catalogue.
#
# Run from the Song2HTML project root:
#     ./update_all.sh
#
# Creates:
#   assets/update.json     - install/application files only
#   assets/catalogue.json  - song catalogue + song count
#
# /songs and /setlists are deliberately excluded from update.json.

set -e

if [ ! -d "songs" ]; then
    echo "Folder not found: songs"
    exit 1
fi

if [ ! -d "assets" ]; then
    echo "Folder not found: assets"
    exit 1
fi

python3 - <<'PY'
import json
import re
from pathlib import Path
from html import unescape

root = Path(".")
songs_dir = root / "songs"
assets_dir = root / "assets"

# ------------------------------------------------------------
# Build assets/catalogue.json
# ------------------------------------------------------------

songs = []

for filename in sorted(songs_dir.glob("*.html")):
    text = filename.read_text(
        encoding="utf-8",
        errors="replace"
    )

    match = re.search(
        r'<h1\s+class=["\']song-title["\']\s*>(.*?)</h1>',
        text,
        re.IGNORECASE | re.DOTALL
    )

    if not match:
        print(f"Warning: no song title found in {filename}")
        continue

    title = unescape(
        re.sub(r"<[^>]+>", "", match.group(1))
    ).strip()

    if not title:
        print(f"Warning: empty song title in {filename}")
        continue

    songs.append({
        "title": title,
        "file": f"songs/{filename.name}"
    })

songs.sort(key=lambda song: song["title"].casefold())

catalogue = {
    "song_count": len(songs),
    "songs": songs
}

catalogue_file = assets_dir / "catalogue.json"

catalogue_file.write_text(
    json.dumps(
        catalogue,
        indent=4,
        ensure_ascii=False
    ) + "\n",
    encoding="utf-8"
)


# ------------------------------------------------------------
# Build assets/all.setlists.json
# ------------------------------------------------------------

setlists_dir = root / "setlists"

setlists = []

if setlists_dir.exists():

    for filename in sorted(
        setlists_dir.glob("*.setlist.json")
    ):

        setlists.append(
            filename.name
        )

all_setlists = {
    "setlists": setlists
}

all_setlists_file = (
    assets_dir /
    "all.setlists.json"
)

all_setlists_file.write_text(
    json.dumps(
        all_setlists,
        indent=4,
        ensure_ascii=False
    ) + "\n",
    encoding="utf-8"
)

print(
    f"Created {all_setlists_file} "
    f"with {len(setlists)} setlists."
)


# ------------------------------------------------------------
# Build assets/update.json
# ------------------------------------------------------------
#
# Every file in the project needed by the installed application
# is included, except:
#   songs/
#   setlists/
#   .git/
#   hidden files/directories
#   *.old / *.bak / *.tmp
#   this helper itself
#
# update.json is added explicitly after the scan.

ignored_dirs = {".git", "songs", "setlists"}
ignored_files = {
    "update_all.sh",
    "save-notes.php",
    "save-scroll-speed.php",
    "save-setlist.php"
}
ignored_suffixes = {".old", ".bak", ".tmp", ".sh", ".txt"}

files = []

for path in root.rglob("*"):
    if not path.is_file():
        continue

    relative = path.relative_to(root)
    parts = relative.parts

    if any(part.startswith(".") for part in parts):
        continue

    if any(part in ignored_dirs for part in parts[:-1]):
        continue

    if relative.name in ignored_files:
        continue

    if relative.suffix.lower() in ignored_suffixes:
        continue

    if relative.as_posix() == "assets/update.json":
        continue

    files.append("./" + relative.as_posix())

files.append("./assets/update.json")
files.sort()

update_file = assets_dir / "update.json"

update_file.write_text(
    json.dumps(
        {"files": files},
        indent=4,
        ensure_ascii=False
    ) + "\n",
    encoding="utf-8"
)

print(f"Created {catalogue_file} with {len(songs)} songs.")
print(f"Created {update_file} with {len(files)} install files.")
PY
