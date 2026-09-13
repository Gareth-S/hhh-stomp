//
// lyrics.js
//
// Version 0.4 -tempo
//
// hhh-stomp
//

document.addEventListener(
    "DOMContentLoaded",
     async function ()
    {
        const songContainer =
            document.getElementById(
                "song-container"
            );

        if (!songContainer)
        {
            return;
        }

        initialiseTheme();
        initialiseTextSize();
        initialiseBurgerMenu();

        const showChords =
            localStorage.getItem("show-chords");

        const showLineNumbers =
            localStorage.getItem("show-line-numbers");

        if (showChords === "false")
        {
            document.body.classList.add(
                "hide-chords"
            );
        }

        if (showLineNumbers === "false")
        {
            document.body.classList.add(
                "hide-line-numbers"
            );
        }

        addLineNumbers();
        addSectionLinks();

        await loadBandNotes();
        await loadUserNotes();

        initialiseBeatButton();
        loadNotesEditor();

        initialiseSongNavigation();
        initialiseSwipeNavigation();
        initialiseStickySections();
        
        enableWakeLock();

        createMeasureDiv();
        wrapAllBlocks();
        
        autoScrollToggle =
    document.getElementById(
        "auto-scroll-toggle"
    );
    
        autoScrollSpeedInput =
    document.getElementById(
        "auto-scroll-speed"
    );


    const showAutoScrollControls =
    localStorage.getItem(
        "show-auto-scroll-controls"
    );

const autoScrollControls =
    document.getElementById(
        "auto-scroll-controls"
    );

if (
    autoScrollControls &&
    showAutoScrollControls !== "true"
)
{
    autoScrollControls.style.display =
        "none";
}

    
    if (autoScrollSpeedInput)
    {
    autoScrollSpeedInput.value = scrollSpeed;
    }


if (autoScrollToggle)
{
    autoScrollToggle.addEventListener(
        "click",
        function ()
        {
            if (autoScrollRunning)
            {
                pauseAutoScroll();
            }
            else
            {
                startAutoScroll();
            }
        }
    );
}
     
     if (autoScrollSpeedInput)
{
    autoScrollSpeedInput.addEventListener(
        "change",
        function ()
        {
            const value =
                Number(
                    autoScrollSpeedInput.value
                );

            if (
                Number.isFinite(value) &&
                value > 0
            )
            {
                scrollSpeed = value;
            }
            else
            {
                updateScrollSpeedInput();
            }
        }
    );

document.getElementById(
    "auto-scroll-faster"
).addEventListener(
    "click",
    function ()
    {
        /*
        console.log(
            "PLUS CLICK",
            scrollSpeed,
            typeof scrollSpeed
        );
        */

        scrollSpeed =
            Number(scrollSpeed) + 2;

        /*    
        console.log(
            "PLUS RESULT",
            scrollSpeed,
            typeof scrollSpeed
        );
        */

        autoScrollSpeedInput.value =
            scrollSpeed;
    }
);


document.getElementById(
    "auto-scroll-slower"
).addEventListener(
    "click",
    function (event)
    {
        event.preventDefault();

        scrollSpeed =
            Math.max(
                1,
                Number(scrollSpeed) - 2
            );

        autoScrollSpeedInput.value =
            scrollSpeed;
    }
);


}
    
/*
 * Save scroll speed.
 */


 const autoScrollSave =
    document.getElementById(
        "auto-scroll-save"
    );

if (autoScrollSave)
{
    autoScrollSave.addEventListener(
        "click",
        async function ()
        {
            const value =
                Number(
                    autoScrollSpeedInput.value
                );

            if (
                !Number.isFinite(value) ||
                value <= 0
            )
            {
                autoScrollSpeedInput.value =
                    scrollSpeed;

                return;
            }

            scrollSpeed =
                value;

            const data =
            {
                user: currentUser(),
                filename: currentSongName(),
                scrollSpeed: scrollSpeed
            };

            try
            {
                const response =
                    await fetch(
                        "../assets/save-scroll-speed.php",
                        {
                            method: "POST",
                            headers:
                            {
                                "Content-Type":
                                    "application/json"
                            },
                            body:
                                JSON.stringify(data)
                        }
                    );

                if (!response.ok)
                {
                    throw new Error(
                        "Could not save scroll speed"
                    );
                }

                console.log(
                    "Scroll speed saved:",
                    scrollSpeed
                );
            }
            catch (error)
            {
                console.log(error);
            }
        }
    );
}    
        
    }
);



let userNotes = null;

let scrollSpeed = 30;

let autoScrollPosition = 0;
let autoScrollFrameId = null;
let autoScrollLastTime = null;
let autoScrollRunning = false;
let autoScrollResumeTimer = null;
let manualScrollPauseActive = false;

let startX = 0;
let startY = 0;
let gestureDirection = null;

let autoScrollToggle = null;
let autoScrollSpeedInput = null;

// startAutoScroll();


// wrap

let measure = null;

 //
// Create one hidden measuring div.
// It is reused for every chord/lyric block.
//

function createMeasureDiv()
{
    measure = document.createElement("div");

    measure.id = "measure";

    measure.style.position = "absolute";
    measure.style.left = "-9999px";
    measure.style.visibility = "hidden";

    document.body.appendChild(measure);

//    console.log("Measure div created");
}


//
// Find every chord/lyric block on the page and keep wrapping
// until no block needs another split.
//

function wrapAllBlocks()
{
    let changed = true;

    while (changed)
    {
        changed = false;

        const blocks =
            document.querySelectorAll(
                ".chord-lyric"
            );

        for (const block of blocks)
        {
            if (wrapChordLyric(block))
            {
                changed = true;
                break;
            }
        }
    }
}


// Wrapping engine.
//
// For now we only ask the browser
// where it wants to wrap.


function wrapChordLyric(block)
{
    const lyrics = block.querySelector(".lyrics");

    const style = getComputedStyle(lyrics);

 /*   
      console.log(
          "WRAP TEST:",
      {
          text: getLyricText(lyrics),
          width: lyrics.clientWidth,
          scrollWidth: lyrics.scrollWidth,
          font: style.font,
          lineHeight: style.lineHeight
    });
    
*/
    
    
const wrap =
    browserWrapPosition(
        getLyricText(lyrics),
        style,
        lyrics.clientWidth
    );

    
    if (wrap)
    {
        splitBlock(
            block,
            wrap.position
            );
    return true;
    }

/*
 * The lyrics fit on one line, but the chords might not.
 * In that case use the last-word fallback.
 */
return wrapChordOverflow(block);


}

//
// Return the actual lyric text without the line number.
//

function getLyricText(element)
{
    const clone =
        element.cloneNode(true);

    const lineNumber =
        clone.querySelector(".line-number");

    if (lineNumber)
    {
        lineNumber.remove();
    }

    return clone.textContent;
}


//
// If the chords still overflow after normal lyric wrapping,
// move the last lyric word and its chord material to a new block.
//
// This fallback is deliberately only applied once to a block.
//

function wrapChordOverflow(block)
{
    /*
     * This block has already had the overflow fallback applied.
     * Don't keep moving words onto new lines.
     */
    if (block.dataset.chordOverflowHandled === "true")
    {
        return false;
    }

    const chords =
        block.querySelector(".chords");

    const lyrics =
        block.querySelector(".lyrics");

    /*
     * Ignore tiny browser rounding/spacing differences.
     */
    if (
        chords.scrollWidth <= chords.clientWidth + 4
    )
    {
        return false;
    }

    const text =
        getLyricText(lyrics).trimEnd();

    /*
     * Find the beginning of the last lyric word.
     */
    const splitAt =
        text.lastIndexOf(" ");

    if (splitAt < 0)
    {
        return false;
    }

    const firstLyrics =
        text.substring(
            0,
            splitAt
        ).trimEnd();

    const secondLyrics =
        text.substring(
            splitAt
        ).trimStart();

    /*
     * Don't create an empty first line.
     */
    if (!firstLyrics || !secondLyrics)
    {
        return false;
    }

    /*
     * Mark the original block before splitting.
     * splitBlock() will copy this state to both new blocks.
     */
    block.dataset.chordOverflowHandled =
        "true";

    /*
     * Move the final lyric word and its chord material
     * to a new line.
     */
    splitBlock(
        block,
        splitAt
    );

    return true;
}



//
// Ask the browser where the text wraps.
//
// Returns the first word on the second line
// together with its character position.
// Returns null if everything fits.
//

function browserWrapPosition(text, style, width)
{
    measure.style.font = style.font;
    measure.style.lineHeight = style.lineHeight;
    measure.style.letterSpacing = style.letterSpacing;
    measure.style.wordSpacing = style.wordSpacing;

    measure.style.whiteSpace = "normal";
    measure.style.width = width + "px";

    const words =
        text.split(" ");

    let line = "";
    let position = 0;
    let lastHeight = 0;

    for (const word of words)
    {
        line += word + " ";

        measure.textContent = line;

        const height =
            measure.offsetHeight;

        if (
            lastHeight !== 0 &&
            height > lastHeight
        )
        {
            return {
                word: word,
                position: position
            };
        }

        position += word.length + 1;

        lastHeight = height;
    }

    return null;
}

//
//
// Split one chord/lyric block into two blocks.
//
// The lyric split position comes from the browser wrapping test.
// Chords are kept whole, and HTML such as .accidental spans
// is preserved.
//

function splitBlock(block, splitAt)
{
    const chordElement =
        block.querySelector(".chords");

    const lyricElement =
        block.querySelector(".lyrics");

    const lyrics =
        getLyricText(lyricElement);

    const chordText =
        chordElement.textContent;

    if (
        splitAt <= 0 ||
        splitAt >= lyrics.length
    )
    {
        return;
    }

    /*
     * Find the chord boundary at the proposed split.
     */
    let chordSplitAt =
        splitAt;

    while (
        chordSplitAt > 0 &&
        chordSplitAt < chordText.length &&
        !/\s/.test(chordText[chordSplitAt])
    )
    {
        chordSplitAt--;
    }

    /*
     * If the split landed inside a chord, move forward
     * to the end of that complete chord.
     */
    if (chordSplitAt < splitAt)
    {
        chordSplitAt =
            splitAt;

        while (
            chordSplitAt < chordText.length &&
            !/\s/.test(chordText[chordSplitAt])
        )
        {
            chordSplitAt++;
        }

        /*
         * Preserve the whitespace immediately before
         * the chord so its horizontal position is retained.
         */
        while (
            chordSplitAt > 0 &&
            /\s/.test(chordText[chordSplitAt - 1])
        )
        {
            chordSplitAt--;
        }
    }

    /*
     * Keep the original line number.
     * It belongs to the first block only.
     */
    const originalLineNumber =
        block.querySelector(".line-number");

    const first =
        block.cloneNode(true);

    const second =
        block.cloneNode(true);

    /*
     * The second block is only a continuation of the
     * original lyric line, so it must not have a number.
     */
    second
        .querySelector(".line-number")
        ?.remove();

    /*
     * Lyrics split at the exact browser-selected position.
     */
    first.querySelector(".lyrics").textContent =
        lyrics.substring(
            0,
            splitAt
        ).trimEnd();

    second.querySelector(".lyrics").textContent =
        lyrics.substring(
            splitAt
        ).trimStart();

    /*
     * Restore the line number to the first block.
     *
     * textContent above removes the original span, and
     * cloneNode() does not preserve its click handler.
     */
    if (originalLineNumber)
    {
        const lineNumber =
            document.createElement("span");

        lineNumber.className =
            "line-number";

        lineNumber.textContent =
            originalLineNumber.textContent;

        lineNumber.dataset.line =
            originalLineNumber.dataset.line;

        lineNumber.addEventListener(
            "click",
            function ()
            {
                openNotesEditor(
                    lineNumber.dataset.line
                );

                console.log(
                    lineNumber.dataset.line
                );
            }
        );

        first
            .querySelector(".lyrics")
            .prepend(lineNumber);
    }

    /*
     * Rebuild the chord contents while preserving
     * accidental spans.
     */
    setChordText(
        first.querySelector(".chords"),
        chordElement,
        0,
        chordSplitAt
    );

    setChordText(
        second.querySelector(".chords"),
        chordElement,
        chordSplitAt,
        chordText.length
    );

    block.replaceWith(
        first,
        second
    );
}


//
// Copy part of a chord element while preserving its HTML.
//
// Character positions refer to the visible text, not the
// HTML markup itself.
//

function setChordText(
    target,
    original,
    start,
    end
)
{
    target.innerHTML = "";

    const walker =
        document.createTreeWalker(
            original,
            NodeFilter.SHOW_TEXT
        );

    let node;
    let position = 0;

    while (
        node = walker.nextNode()
    )
    {
        const text =
            node.textContent;

        const nodeStart =
            position;

        const nodeEnd =
            position + text.length;

        const copyStart =
            Math.max(
                start,
                nodeStart
            );

        const copyEnd =
            Math.min(
                end,
                nodeEnd
            );

        if (copyStart < copyEnd)
        {
            const clone =
                node.parentElement === original
                    ? document.createTextNode(
                        text.substring(
                            copyStart - nodeStart,
                            copyEnd - nodeStart
                        )
                    )
                    : cloneChordTextNode(
                        node,
                        original,
                        copyStart - nodeStart,
                        copyEnd - nodeStart
                    );

            target.appendChild(clone);
        }

        position =
            nodeEnd;
    }
    
}

//
// Clone a chord text node together with its parent
// markup, such as the .accidental span.
//

function cloneChordTextNode(
    node,
    original,
    start,
    end
)
{
    const parent =
        node.parentElement.cloneNode(false);

    parent.textContent =
        node.textContent.substring(
            start,
            end
        );

    return parent;
}



// current user of the app

   function currentUser()
{
    return localStorage.getItem(
        "current-user"
    );
 
    //return "Dick";
    
}


/*----------------------------------------------------------*/
/* Inline User Cues                                          */
/*----------------------------------------------------------*/

function renderInlineCue(member, text, lyricLine)
{
    const cue =
        document.createElement("div");

cue.className =
    member === currentUser()
        ? "cue user-cue inline-cue"
        : "cue user-cue inline-cue other-user-note";
        
    const authorPrefix =
        member === currentUser()
            ? ""
            : "[" + member + "] ";

    cue.textContent =
        authorPrefix + text;

    const chordLine =
        lyricLine.previousElementSibling;

    lyricLine.parentNode.insertBefore(
        cue,
        lyricLine
    );
}


/*----------------------------------------------------------*/
/* Section Band Notes                                       */
/*----------------------------------------------------------*/

function insertBandNotes(data)
{
    if (!data.notes)
    {
        return;
    }

    for (const line in inline)
    {
        const lyric =
            document.querySelector(
                '.lyrics[data-line="' +
                line.replace("line-", "") +
                '"]'
            );

        if (!lyric)
        {
            continue;
        }

        renderInlineCue(
            data.user,
            data.notes[line],
            lyric
        );
    }
}



function addSectionLinks()
{
    document
        .querySelectorAll(".section-link")
        .forEach(
            icon => icon.remove()
        );

    if (
        document.body.classList.contains(
            "hide-line-numbers"
        )
    )
    {
        return;
    }

    const sections =
        document.querySelectorAll(".song-section");

    for (const section of sections)
    {
        const heading =
            section.querySelector("h2");

        if (!heading)
        {
            continue;
        }

        const icon =
            document.createElement("span");

        icon.className =
            "section-link";

        icon.textContent =
            " 📝";

        icon.dataset.section =
            section.id;

        icon.addEventListener(
            "click",
            function ()
            {
                console.log(
                    "Section clicked",
                    icon.dataset.section
                );

                openNotesEditor(
                    icon.dataset.section
                );
            }
        );

        heading.append(icon);
    }
}



function insertSectionBandNotes(sections)
{
    if (!sections)
    {
        return;
    }

    for (const sectionId in sections)
    {
        const section =
            document.getElementById(sectionId);

        if (!section)
        {
            continue;
        }

        const heading =
            section.querySelector("h2");

        for (const note of sections[sectionId])
        {
            const p =
                document.createElement("p");

            p.className = "band-note";

            p.textContent = note;

            if (heading)
            {
                heading.insertAdjacentElement(
                    "afterend",
                    p
                );
            }
            else
            {
                section.prepend(p);
            }
        }
    }
}


/*----------------------------------------------------------*/
/* Section User Notes                                       */
/*----------------------------------------------------------*/

function insertSectionUserNotes(user, sections)
{
    if (!sections)
    {
        return;
    }

    for (const sectionId in sections)
    {
        const section =
            document.getElementById(sectionId);

        if (!section)
        {
            continue;
        }

        const heading =
            section.querySelector("h2");

        for (const note of sections[sectionId])
        {
            const p =
                document.createElement("p");

p.className =
    user === currentUser()
        ? "user-note"
        : "user-note other-user-note";
        
        
            const authorPrefix =
                user === currentUser()
                    ? ""
                    : "[" + user + "] ";

            p.textContent =
                authorPrefix + note;

            if (heading)
            {
                heading.insertAdjacentElement(
                    "afterend",
                    p
                );
            }
            else
            {
                section.prepend(p);
            }
        }
    }
}


/*----------------------------------------------------------*/
/* Inline Band Notes                                        */
/*----------------------------------------------------------*/

function insertInlineBandNotes(inline)
{
    if (!inline)
    {
        return;
    }

    for (const line in inline)
    {
        const lyric =
            document.querySelector(
                '.lyrics[data-line="' +
                line.replace("line-", "") +
                '"]'
            );

        if (!lyric)
        {
            continue;
        }

        renderInlineBandCue(
            inline[line],
            lyric
        );
    }
}


function clearUserNotesDisplay()
{
    document
        .querySelectorAll(".user-note, .user-cue")
        
        .forEach(
            note => note.remove()
            );
}


/*----------------------------------------------------------*/
/* Render Inline Band Cue                                   */
/*----------------------------------------------------------*/

function renderInlineBandCue(notes, lyric)
{
    const cue =
        document.createElement("div");

    cue.className =
        "cue band-cue inline-cue";

    cue.textContent =
        notes.join(" ");

    lyric.parentNode.insertBefore(
        cue,
        lyric
    );
}

function insertUserNotes(user, inline)
{
    if (!inline)
    {
        return;
    }

    for (const line in inline)
    {
        const lyric =
            document.querySelector(
                '.lyrics[data-line="' +
                line.replace("line-", "") +
                '"]'
            );

        if (!lyric)
        {
            continue;
        }
        
        /*
  console.log(
    "RENDER INLINE:",
    user,
    line,
    inline[line]
);      
        */
        
    
        renderInlineCue(
            user,
            inline[line],
            lyric
        );
    }
}

/*----------------------------------------------------------*/
/* Top Band Notes                                            */
/*----------------------------------------------------------*/

function insertBandNotes(notes)
{
    if (!notes || notes.length === 0)
    {
        return;
    }

    const container =
        document.querySelector(".song-notes");

    if (!container)
    {
        return;
    }

    for (const note of notes)
    {
        const p =
            document.createElement("p");

        p.className = "band-note";

        p.textContent = note;

        container.appendChild(p);
    }
}

/*----------------------------------------------------------*/
/* Top User Notes                                            */
/*----------------------------------------------------------*/

function insertTopUserNotes(user, notes)
{
    if (!notes || notes.length === 0)
    {
        return;
    }

    const container =
        document.querySelector(".song-notes");

    if (!container)
    {
        return;
    }

    for (const note of notes)
    {
        const p =
            document.createElement("p");

p.className =
    user === currentUser()
        ? "user-note"
        : "user-note other-user-note";
        
        
        const authorPrefix =
            user === currentUser()
                ? ""
                : "[" + user + "] ";

        p.textContent =
            authorPrefix + note;

        container.appendChild(p);
    }
}

//
// Add line numbers to every lyric line.
//

function addLineNumbers()
{
    const lyrics =
        document.querySelectorAll(".lyrics");

    for (const line of lyrics)
    {
        const number = line.dataset.line;
        if (!number)
            continue;

        const span = document.createElement("span");

        span.className = "line-number";

        span.textContent = number;

        span.dataset.line = line.id;

        span.addEventListener("click", function ()
            {
                openNotesEditor(span.dataset.line);
                console.log(span.dataset.line);
            }
        );

        line.prepend(span);
    }
}

/*----------------------------------------------------------*/
/* Band Notes                                                */
/*----------------------------------------------------------*/

function currentSongName()
{
    const filename =
        window.location.pathname
            .split("/")
            .pop();

    return filename.replace(".html", "");
}

function enabledMembers()
{
    const members = [];

    for (const key in localStorage)
    {
        if (!key.startsWith("notes-"))
            continue;

        if (localStorage.getItem(key) !== "true")
            continue;

        members.push(
            key.replace("notes-", "")
        );
    }

    return members;
}

function notesFilename(song, member)
{
    return (
        song +
        "." +
        member.toLowerCase() +
        ".json"
    );
}


async function loadBandNotes()
{
    const song =
        currentSongName();

    console.log(song);

    try
    {

            const filename =
                currentSongName() + ".json";

            const response =
                await fetch(filename);
    
 //       const response =
 //           await fetch("tiny.json");

        if (!response.ok)
        {
            console.log("json not found");
            return;
        }

        const songData =
            await response.json();

        console.log(songData);
        
        
        // scrolling
        
scrollSpeed =
      Number(songData.scrollSpeed ?? 30);

console.log(
    "Song scroll speed =",
    scrollSpeed
);


               
  //tempo call
                
        if (songData.tempo)
        {
            configureBeatEngine(songData.tempo);
        }           

        // startBeatEngine();  // Manual activation only  
        
        insertBandNotes(songData.songNotes);
        insertSectionBandNotes(songData.sections);
        insertInlineBandNotes(songData.inline);

    }

    catch (error)
    {
        console.log(error);
    }
}


/*----------------------------------------------------------*/
/* User Notes                                                */
/*----------------------------------------------------------*/



async function loadUserNotes()
{
    const song =
        currentSongName();

    const members =
        enabledMembers();

    console.log(song);

    console.log(members);

    for (const member of members)
    {
        const filename =
            notesFilename(song, member);

        console.log(filename);

        try
        {
            const response =
                await fetch(filename);

            if (!response.ok)
            {
                console.log(filename + " not found" );
 
            if (member === currentUser())
                {
                    userNotes =
                    {
                        user: currentUser(),
                        songNotes: [],
                        sections: {},
                        inline: {}
                    };
                }

                continue;
            }

            const notes =
                await response.json();
                
                
            console.log("LOADED NOTES FOR:", member, notes);
            
            
        if (member === currentUser())
            {
                userNotes = notes;
            }

// scrolling

            
 if (
    member === currentUser() &&
    notes.scrollSpeed !== undefined &&
    notes.scrollSpeed !== null
)
{
    scrollSpeed =
         Number(notes.scrollSpeed);

    console.log(
        "User scroll speed =",
        scrollSpeed
    );
}
 
        if (autoScrollSpeedInput)
        {
            autoScrollSpeedInput.value = scrollSpeed;
        }
        
        
        
//            console.log(notes);
//            insertTopNotes(notes);  
//            insertUserNotes(notes);
                
            insertUserNotes(notes.user,notes.inline);
            insertTopUserNotes(notes.user,notes.songNotes);
            insertSectionUserNotes(notes.user,notes.sections);
        
        }

        catch (error)
        {
            console.log(error);
        }
    }
        
}



function populateNotesEditor()
{
    if (!userNotes)
    {
        console.log("No user notes available");
        return;
    }

    document
        .getElementById("song-notes")
        .value =
        userNotes.songNotes || "";
}


/*----------------------------------------------------------*/
/* Note Rendering                                            */
/*----------------------------------------------------------*/

function insertTopNotes(notes)
{
    console.log("Insert top notes", notes);
}

/*----------------------------------------------------------*/
/* Notes Editor                                               */
/*----------------------------------------------------------*/

function loadNotesEditor()
{
    fetch("../assets/notes-editor.html")

        .then(response => response.text())

        .then(html =>
        {
            document
                .getElementById(
                    "notes-editor-container"
                )
                .innerHTML = html;

            initialiseNotesEditor();
        });
}


let currentTarget = null;

function populateSectionNotesEditor()
{
    const body = document.getElementById(
            "section-notes-body"
        );

    if (!body || !userNotes)
    {
        return;
    }

    body.innerHTML = "";

    const sections = userNotes.sections || {};

    for (const sectionId in sections)
    {
        const notes = sections[sectionId];

        for (const note of notes)
        {
            const row = document.createElement("tr");

            row.innerHTML = 
                `<td>
                    <input type="text" value="${sectionId}"  class="section-target"maxlength="3">
                </td>

                <td>
                    <input type="text" value="${note}" class="section-note" >
                </td>
            `;

            body.appendChild(row);
        }
    }
}


function populateLineNotesEditor()
{
    const body = document.getElementById(
            "line-notes-body"
        );

    if (!body || !userNotes)
    {
        return;
    }

    body.innerHTML = "";

    const inline =
        userNotes.inline || {};

    for (const lineId in inline)
    {
        const notes = inline[lineId];

        for (const note of notes)
        {
            const row =  document.createElement("tr");

            row.innerHTML =
                ` <td>
                    <input type="text" value="${lineId}" class="line-target" maxlength="3">
                </td>

                <td>
                    <input type="text" value="${note}" class="line-note">
                </td>
            `;

            body.appendChild(row);
        }
    }
}


function openNotesEditor(targetId)
{
    currentTarget = targetId;

    console.log(
        "Opening editor for",
        targetId
    );

    populateNotesEditor();
    populateSectionNotesEditor();
    populateLineNotesEditor();

    document
        .getElementById("notes-editor")
        .classList
        .remove("hidden");

    if (targetId.startsWith("section-"))
    {
        addSectionRowForTarget(targetId);
    }

    if (targetId.startsWith("line-"))
    {
        addLineRowForTarget(targetId);
    }
}


function addSectionRowForTarget(targetId)
{
    const body =
        document.getElementById(
            "section-notes-body"
        );

    const existing =
        body.querySelectorAll("tr");

    for (const row of existing)
    {
        const input =
            row.querySelector(
                ".section-target"
            );

        if (
            input &&
            input.value === targetId
        )
        {
            row
                .querySelector(".section-note")
                .focus();

            return;
        }
    }

    const row =
        addSectionRow();

    row.querySelector(
        ".section-target"
    ).value = targetId;

    row.querySelector(
        ".section-note"
    ).focus();
}



function closeNotesEditor()
{
    document
        .getElementById("notes-editor")
        .classList
        .add("hidden");
}



function initialiseNotesEditor()
{
    document
        .getElementById("save-note")
        .addEventListener(
            "click",
            async function ()
            {
                const notes =
                    collectNotesFromEditor();

                console.log(
                    JSON.stringify(
                        notes,
                        null,
                        4
                    )
                );

                try
                {
                    const response =
                        await fetch(
                            "../assets/save-notes.php",
                            {
                                method: "POST",

                                headers:
                                {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify(
                                        notes
                                    )
                            }
                        );

                    const result =
                        await response.json();

                    console.log(
                        "SAVE RESULT:",
                        result
                    );
                      

            if (result.success)
                {
                    closeNotesEditor();
                }

            }
                
                catch (error)
                {
                    console.error(
                        "SAVE ERROR:",
                        error
                    );
                }
            }
        );

    document
        .getElementById("cancel-note")
        .addEventListener(
            "click",
            closeNotesEditor
        );

    document
        .getElementById("add-section-row")
        .addEventListener(
            "click",
            addSectionRow
        );

    document
        .getElementById("add-line-row")
        .addEventListener(
            "click",
            addLineRow
        );
}



function addSectionRow()
{
    const body =
        document.getElementById(
            "section-notes-body"
        );

    const row =
        document.createElement("tr");

    row.innerHTML = `
        <td>
            <input type="text" value="${currentTarget}" class="section-target" placeholder="section">
        </td>

        <td>
            <input type="text" class="section-note" placeholder="Note">
        </td>
    `;

    body.appendChild(row);
    
    return row;
}

function addLineRow()
{
    const body =
        document.getElementById(
            "line-notes-body"
        );

    const row =
        document.createElement("tr");

    row.innerHTML = `
        <td>
            <input
                type="text" value="" class="line-target" placeholder="line">
        </td>

        <td>
            <input
                type="text" class="line-note" placeholder="Note">
        </td>
    `;

    body.appendChild(row);
    
    return row;
}



function addLineRowForTarget(targetId)
{
    const body =
        document.getElementById(
            "line-notes-body"
        );

    const existing =
        body.querySelectorAll(
            ".line-target"
        );

    for (const input of existing)
    {
        if (input.value === targetId)
        {
            input
                .closest("tr")
                .querySelector(".line-note")
                .focus();

            return;
        }
    }

    const row =
        addLineRow();

    row.querySelector(
        ".line-target"
    ).value = targetId;

    row.querySelector(
        ".line-note"
    ).focus();
}



// section notes

function collectNotesFromEditor()
{
    
    
    const path =
    window.location.pathname;

const filename =
    decodeURIComponent(
        path
            .split("/")
            .pop()
    )
    .replace(
        /\.html$/,
        ""
    );

const notes =
{
    user: currentUser(),
    filename: filename,
    songNotes: [],
    sections: {},
    inline: {}
};

    const songNotes =
        document.getElementById(
            "song-notes"
        ).value.trim();

    if (songNotes)
    {
        notes.songNotes.push(
            songNotes
        );
    }

    const sectionRows =
    document.querySelectorAll(
        "#section-notes-body tr"
    );

for (const row of sectionRows)
{
    const section =
        row.querySelector(
            ".section-target"
        ).value.trim();

    const note =
        row.querySelector(
            ".section-note"
        ).value.trim();

    if (!section || !note)
    {
        continue;
    }

    if (!notes.sections[section])
    {
        notes.sections[section] = [];
    }

    notes.sections[section].push(
        note
    );
}
    
    // in-line notes
    
 const lineRows =
    document.querySelectorAll(
        "#line-notes-body tr"
    );

for (const row of lineRows)
{
    const line =
        row.querySelector(
            ".line-target"
        ).value.trim();

    const note =
        row.querySelector(
            ".line-note"
        ).value.trim();

    if (!line || !note)
    {
        continue;
    }

    if (!notes.inline[line])
    {
        notes.inline[line] = [];
    }

    notes.inline[line].push(
        note
    );
}   
    notes.sections = sortNoteTargets(notes.sections);
    notes.inline = sortNoteTargets(notes.inline);

    return notes;
}



function sortNoteTargets(notes)
{
    const sorted = {};

    const keys =
        Object.keys(notes)
            .sort(
                function (a, b)
                {
                    const numberA =
                        parseInt(
                            a.split("-")[1]
                        );

                    const numberB =
                        parseInt(
                            b.split("-")[1]
                        );

                    return numberA - numberB;
                }
            );

    for (const key of keys)
    {
        sorted[key] = notes[key];
    }

    return sorted;
}



/*
 * Set up previous/next song navigation.
 *
 * The song URL tells us which list was used to open the song
 * and its position within that list.
 */

async function initialiseSongNavigation()
{
    console.log(
        "NAVIGATION INITIALISING"
    );

    console.log(
        "NAV URL:",
        window.location.href
    );

    console.log(
        "NAV PARAMS:",
        window.location.search
    );

    const params =
        new URLSearchParams(
            window.location.search
        );

    const source =
        params.get("source");

    const index =
        Number(
            params.get("index")
        );

    if (
        !source ||
        !Number.isInteger(index) ||
        index < 0
    )
    {
        return;
    }

    
    /*
 * Load the same list that was used to open this song.
 *
 * Catalogue songs come from catalogue.json.
 * Setlist songs normally come from the temporary setlist
 * stored for this browser session.
 *
 * If there is no temporary setlist, fall back to the
 * latest saved current.setlist.json.
 */
    
let songs;

if (source === "catalogue")
{
    const response =
        await fetch(
            "../assets/catalogue.json?ts=" +
            Date.now()
        );

    if (!response.ok)
    {
        console.error(
            "Unable to load song navigation list"
        );

        return;
    }

    const data =
        await response.json();

    songs =
        data.songs;
}
else
{
    const temporarySetlist =
        sessionStorage.getItem(
            "current_setlist"
        );

    if (temporarySetlist)
    {
        try
        {
            songs =
                JSON.parse(
                    temporarySetlist
                );
        }
        catch (error)
        {
            console.error(
                "Unable to read temporary setlist:",
                error
            );

            return;
        }
    }
    else
    {
        const response =
            await fetch(
                "../assets/current.setlist.json?ts=" +
                Date.now()
            );

        if (!response.ok)
        {
            console.error(
                "Unable to load song navigation list"
            );

            return;
        }

        const data =
            await response.json();

        songs =
            data.songs;
    }
}
    
 
 
    /*
     * There are navigation controls at both the top
     * and bottom of the song page.
     */
    const previous =
        document.querySelectorAll(
            ".prev-song, .prev-song-footer"
        );

    const next =
        document.querySelectorAll(
            ".next-song, .next-song-footer"
        );

    if (
        previous.length === 0 ||
        next.length === 0
    )
    {
        return;
    }


    /*
 * Song paths in the JSON are relative to the site root.
 *
 * This script runs from inside /songs/, so remove the
 * "songs/" part before using the path for navigation.
 */

function songNavigationPath(file)
{
    /*
     * Remove any existing navigation query string
     * and fragment from the song path.
     *
     * current.setlist.json stores songs with:
     *
     *     ?source=setlist&index=n
     *
     * cleanSongPath() removes these before we add the
     * new source/index for the destination song.
     */
    let cleanFile =
        cleanSongPath(file);

    /*
     * Song paths in the JSON are relative to the
     * site root, but this script runs inside /songs/.
     *
     * Remove "songs/" so the returned path points to
     * the song correctly from the current directory.
     */
    if (cleanFile.startsWith("songs/"))
    {
        cleanFile =
            cleanFile.substring(6);
    }

    return cleanFile;
}
    
    
    /*
     * First song: previous returns to setlists.
     */
    
    if (index === 0)
    {
        previous.forEach(
            link =>
            {
                link.href =
                    "../setlists.html";
            }
        );
    }
    else
    {
        const previousUrl =
            songNavigationPath(
                songs[index - 1].file
            ) +
            "?source=" +
            source +
            "&index=" +
            (index - 1);

        previous.forEach(
            link =>
            {
                link.href =
                    previousUrl;
            }
        );
    }

    /*
     * Last song: next returns to setlists.
     */
    if (index >= songs.length - 1)
    {
        next.forEach(
            link =>
            {
                link.href =
                    "../setlists.html";
            }
        );
    }
    else
    {
        const nextUrl =
            songNavigationPath(
                songs[index + 1].file
            ) +
            "?source=" +
            source +
            "&index=" +
            (index + 1);

        next.forEach(
            link =>
            {
                link.href =
                    nextUrl;
            }
        );
    }
}

/*----------------------------------------------------------*/
/* Swipe navigation                                         */
/*----------------------------------------------------------*/

function initialiseSwipeNavigation()
{
    let startX = 0;
    let startY = 0;

    document.addEventListener(
        "pointerdown",
        event =>
        {
            if (event.pointerType !== "touch")
            {
                return;
            }

            startX = event.clientX;
            startY = event.clientY;
            gestureDirection = null;
        }
    );

document.addEventListener(
    "pointermove",
    event =>
    {
        if (event.pointerType !== "touch")
        {
            return;
        }

        const deltaX =
            event.clientX - startX;

        const deltaY =
            event.clientY - startY;

        if (
            gestureDirection === null &&
            Math.abs(deltaY) > 10 &&
            Math.abs(deltaY) > Math.abs(deltaX)
        )
        {
            gestureDirection = "vertical";
        }

        if (gestureDirection === "vertical")
        {
            pauseAutoScrollForManualScroll();
        }
    }
);    
    
    document.addEventListener(
        "pointerup",
        event =>
        {
            if (event.pointerType !== "touch")
            {
                return;
            }

            const deltaX =
                event.clientX - startX;

            const deltaY =
                event.clientY - startY;

/*
 * Vertical movement:
 *
 * This is a normal manual scroll rather
 * than a horizontal song swipe.
 */
if (
    Math.abs(deltaX) < 50 ||
    Math.abs(deltaX) < Math.abs(deltaY) * 0.75
)
{
    return;
}
            /*
             * Horizontal movement:
             *
             * Leave auto-scroll alone here.
             * The horizontal swipe changes song and
             * the new page will start with auto-scroll
             * OFF.
             */
            if (deltaX < 0)
            {
                const next =
                    document.querySelector(
                        ".next-song"
                    );

                if (next)
                {
                    next.click();
                }
            }
            else
            {
                const previous =
                    document.querySelector(
                        ".prev-song"
                    );

                if (previous)
                {
                    previous.click();
                }
            }
        }
    );
}

/*----------------------------------------------------------*/
/* Automatic scrolling                                      */
/*----------------------------------------------------------*/

function startAutoScroll()
{
    if (autoScrollRunning)
    {
        return;
    }

    autoScrollRunning = true;

    autoScrollPosition =
        window.scrollY;

    autoScrollLastTime = null;
    
    
    if (autoScrollToggle)
{
    autoScrollToggle.textContent = "Ⅱ";
}

    autoScrollFrameId =
        requestAnimationFrame(
            autoScrollFrame
        );
}



function pauseAutoScroll()
{
    autoScrollRunning = false;

    if (autoScrollFrameId !== null)
    {
        cancelAnimationFrame(
            autoScrollFrameId
        );

        autoScrollFrameId = null;
    }

    autoScrollLastTime = null;
    
    if (autoScrollToggle)
{
    autoScrollToggle.textContent = "▶";
}


}


function autoScrollFrame(timestamp)
{
    if (!autoScrollRunning)
    {
        return;
    }

    if (autoScrollLastTime === null)
    {
        autoScrollLastTime = timestamp;
    }

    const elapsed =
        timestamp -
        autoScrollLastTime;

    autoScrollLastTime =
        timestamp;

    autoScrollPosition +=
        scrollSpeed *
        elapsed /
        1000;

        
//    autoScrollScrollEvent = true;

    window.scrollTo(
        0,
        autoScrollPosition
                );
    
    
    if (
        window.scrollY >=
        document.documentElement.scrollHeight -
        window.innerHeight -
        1
    )
    {
        pauseAutoScroll();
        return;
    }

    autoScrollFrameId =
        requestAnimationFrame(
            autoScrollFrame
        );
}


/*
function pauseAutoScrollTemporarily()
{
    pauseAutoScroll();

    clearTimeout(
        autoScrollResumeTimer
    );

    autoScrollPausedUntil =
        Date.now() + 5000;

    autoScrollResumeTimer =
        setTimeout(
            function ()
            {
                autoScrollPausedUntil = 0;

                startAutoScroll();
            },
            5000
        );
}
*/


function pauseAutoScrollForManualScroll()
{
    /*
     * If auto-scroll is off and there is no
     * existing manual-scroll pause, do nothing.
     */
    if (
        !autoScrollRunning &&
        !manualScrollPauseActive
    )
    {
        return;
    }

    /*
     * Stop auto-scroll immediately.
     */
    if (autoScrollRunning)
    {
        pauseAutoScroll();
    }

    manualScrollPauseActive = true;

    /*
     * Reset the five-second timer.
     */
    clearTimeout(
        autoScrollResumeTimer
    );

    autoScrollResumeTimer =
        setTimeout(
            function ()
            {
                manualScrollPauseActive = false;

                startAutoScroll();
            },
            3000
        );
}




/*----------------------------------------------------------*/
/* Sticky section scrolling                                 */
/*----------------------------------------------------------*/

let stickyScrollTimer = null;

function initialiseStickySections()
{
    document.addEventListener(
        "scroll",
        function ()
        {
            clearTimeout(
                stickyScrollTimer
            );

            stickyScrollTimer =
                setTimeout(
                    settleNearestSection,
                    120
                );
        },
        {
            passive: true
        }
    );
}


function settleNearestSection()
{
    const sections =
        document.querySelectorAll(
            ".song-section h2"
        );

    if (sections.length === 0)
    {
        return;
    }

    
const setting =
    localStorage.getItem(
        "section-stickiness"
    );

let stickyDistance = 50;

if (setting === "off")
{
    stickyDistance = 0;
}
else if (setting === "aggressive")
{
    stickyDistance = 100;
}

    let nearest = null;
    let nearestDistance =
        Infinity;

    for (const section of sections)
    {
        const distance =
            Math.abs(
                section.getBoundingClientRect().top
            );

        if (
            distance < nearestDistance
        )
        {
            nearest =
                section;

            nearestDistance =
                distance;
        }
    }

    /*
     * Only snap when a section heading is already
     * reasonably close to the top of the screen.
     */
    if (
        nearest &&
        nearestDistance <= stickyDistance
    )
    {
        nearest.scrollIntoView(
            {
                behavior: "smooth",
                block: "start"
            }
        );
    }
}


function updateScrollSpeedInput()
{
    if (autoScrollSpeedInput)
    {
        autoScrollSpeedInput.value =
            scrollSpeed;
    }
}
