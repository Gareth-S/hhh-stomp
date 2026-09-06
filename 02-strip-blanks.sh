#!/bin/bash
# keep-blank-near.sh
# Usage: ./keep-blank-near.sh song.txt > cleaned.txt

if [ $# -ne 1 ]; then
    echo "Usage: $0 file.txt" >&2
    exit 1
fi

awk '
{
    # strip trailing whitespace from every line
    sub(/[[:space:]]+$/, "", $0)
    lines[NR] = $0
}
END {
    # find the last non-blank line so we can drop trailing blanks
    last = 0
    for (i = 1; i <= NR; i++) {
        if (lines[i] !~ /^[[:space:]]*$/)
            last = i
    }

    for (i = 1; i <= last; i++) {
        if (lines[i] ~ /^[[:space:]]*$/) {
            # blank line – keep only if a neighbour has [ or |
            prev_ok = (i > 1  && lines[i-1] ~ /[\[|]/)
            next_ok = (i < last && lines[i+1] ~ /[\[|]/)
            if (prev_ok || next_ok)
                print lines[i]
        } else {
            print lines[i]
        }
    }
}
' "$1"
