//
// lyrics.js
//
// Version 0.4 -tempo
//
// hhh-stomp
//

document.addEventListener(
    "DOMContentLoaded",
    function ()
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

        loadBandNotes();
        loadUserNotes();

        initialiseBeatButton();
        loadNotesEditor();

        initialiseSongNavigation();
        initialiseSwipeNavigation();

        enableWakeLock();

        createMeasureDiv();
        wrapAllBlocks();
    }
);

let userNotes = null;

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
// Find every chord/lyric pair on the page
// and pass it to the wrapping engine.
//

function wrapAllBlocks()
{
    const blocks = document.querySelectorAll(".chord-lyric");

//    console.log("Found", blocks.length, "wrapping blocks");

    for (const block of blocks) {

        wrapChordLyric(block);

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

    const browserWord =
        browserWrapPosition(
            lyrics.textContent,
            style,
            lyrics.clientWidth
        );

 //   console.log("Browser chose:", browserWord);
        
    if (browserWord)
    splitBlock(block, browserWord);
}






// Ask the browser where it wants to wrap.
//
// Returns:
//     the first word on the second line
// or  null if everything fits.

function browserWrapPosition(text, style, width)
{
    measure.style.font = style.font;
    measure.style.lineHeight = style.lineHeight;
    measure.style.letterSpacing = style.letterSpacing;
    measure.style.wordSpacing = style.wordSpacing;

    measure.style.whiteSpace = "normal";
    measure.style.width = width + "px";

    const words = text.split(" ");

    let line = "";
    let lastHeight = 0;

    for (const word of words) {

        line += word + " ";

        measure.textContent = line;

        const height = measure.offsetHeight;

        if (lastHeight !== 0 && height > lastHeight) {

 //           console.log("Browser wraps before:", word);

            return word;

        }

        lastHeight = height;

    }

    return null;
}


// Split one chord/lyric block into two blocks.
//
// Currently this is a prototype.
// The split word is supplied directly.


function splitBlock(block, splitWord)
{
    const chords = block.querySelector(".chords").textContent;
    const lyrics = block.querySelector(".lyrics").textContent;

    const splitAt = lyrics.indexOf(splitWord);

    if (splitAt < 0)
        return;

    const first = block.cloneNode(true);
    const second = block.cloneNode(true);

    first.querySelector(".lyrics").textContent =
        lyrics.substring(0, splitAt).trimEnd();

    second.querySelector(".lyrics").textContent =
        lyrics.substring(splitAt).trimStart();

    // Prototype only.
    // Chords are split at exactly the same character position.
    first.querySelector(".chords").textContent =
        chords.substring(0, splitAt).trimEnd();

    second.querySelector(".chords").textContent =
        chords.substring(splitAt).trimStart();

    block.replaceWith(first, second);
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
        "cue user-cue inline-cue";

    cue.textContent =
        "[" + member + "] " + text;

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
                "user-note";

            p.textContent =
                "[" +
                user +
                "] " +
                note;

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
        
  console.log(
    "RENDER INLINE:",
    user,
    line,
    inline[line]
);      

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
            "user-note";

        p.textContent =
            "[" + user + "] " + note;

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

               
  //tempo call
                
        if (songData.tempo)
        {
            configureBeatEngine(songData.tempo);
        }           

        startBeatEngine();
        
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
            
            console.log(
    "Tom/Gareth JSON:",
    member,
    notes
);
                
        if (member === currentUser())
            {
                userNotes = notes;
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
             * Ignore short movements and vertical swipes.
             */
            if (
                Math.abs(deltaX) < 50 ||
                Math.abs(deltaX) < Math.abs(deltaY) * 0.75
//                Math.abs(deltaX) <= Math.abs(deltaY)
            )
            {
                return;
            }

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
