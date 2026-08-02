document.addEventListener("DOMContentLoaded", function ()
{
    const block = document.querySelector(".chord-lyric");

    if (!block)
        return;

    prototype(block);
});

function prototype(block)
{
    // everything goes here

    const chords = block.querySelector(".chords");
    const lyrics = block.querySelector(".lyrics");

    const chordText = chords.textContent;
    const lyricText = lyrics.textContent;

    const splitAt = 7;

    const chord1 = chordText.substring(0, splitAt);
    const chord2 = chordText.substring(splitAt);

    const lyric1 = lyricText.substring(0, splitAt);
    const lyric2 = lyricText.substring(splitAt);

    const first = makePair(chord1, lyric1);
    const second = makePair(chord2, lyric2);

    block.replaceWith(first, second);
}

function makePair(chord, lyric)
{
    const pair = document.createElement("div");
    pair.className = "chord-lyric";

    const c = document.createElement("div");
    c.className = "chords";
    c.textContent = chord;

    const l = document.createElement("div");
    l.className = "lyrics";
    l.textContent = lyric;

    pair.appendChild(c);
    pair.appendChild(l);

    return pair;
}
