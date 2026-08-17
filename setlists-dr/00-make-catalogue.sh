#!/bin/bash

# Create an alphabetically sorted catalogue.json from HTML song files.
#
# Usage:
#     ./make-catalogue.sh songs
#
# The song title is read from:
#     <h1 class="song-title">Song Title</h1>
#
# The resulting catalogue.json is written into the supplied folder.

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <songs-folder>"
    exit 1
fi

FOLDER="$1"

if [ ! -d "$FOLDER" ]; then
    echo "Folder not found: $FOLDER"
    exit 1
fi

python3 - "$FOLDER" <<'PY'
import sys
import json
import re
from pathlib import Path
from html import unescape


folder = Path(sys.argv[1])


songs = []


for filename in sorted(folder.glob("*.html")):
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
        print(
            f"Warning: no song title found in {filename}",
            file=sys.stderr
        )
        continue

    title = unescape(
        re.sub(
            r"<[^>]+>",
            "",
            match.group(1)
        )
    ).strip()

    if not title:
        print(
            f"Warning: empty song title in {filename}",
            file=sys.stderr
        )
        continue

    songs.append(
        {
            "title": title,
            "file": f"{folder.as_posix()}/{filename.name}"
        }
    )


songs.sort(
    key=lambda song: song["title"].casefold()
)


output = folder / "catalogue.json"


output.write_text(
    json.dumps(
        {
            "songs": songs
        },
        indent=4,
        ensure_ascii=False
    ) + "\n",
    encoding="utf-8"
)


print(
    f"Created {output} with {len(songs)} songs."
)
PY
