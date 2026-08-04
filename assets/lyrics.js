//
// lyrics.js
//
// Version 0.3 - theme
//
// hhh-stomp
//

// Burger Bar

document.addEventListener("DOMContentLoaded", function () {

const songContainer = document.getElementById("song-container");

if (!songContainer)
{
    return;
}


//
// Read user settings.
//
    
const showChords = localStorage.getItem("show-chords");
const showLineNumbers = localStorage.getItem("show-line-numbers");
const theme = localStorage.getItem("theme");
const textSize = localStorage.getItem("text-size");


// console.log("show-line-numbers =", showLineNumbers);

if (showChords === "false")
{
    document.body.classList.add("hide-chords");
}

if (showLineNumbers === "false")
{
    document.body.classList.add("hide-line-numbers");
}

    // Add line numbers to the page.
    addLineNumbers();


// console.log("show-chords =", showChords);
    
    
function applyTheme(themeName)
{
    document.body.classList.remove(

        "default-theme",
        "light-theme",
        "dark-theme"

    );

    document.body.classList.add(

        themeName + "-theme"

    );
}
    
if (theme)
{
    applyTheme(theme);
}

applyTextSize(textSize);

loadUserNotes();


const currentTheme = theme || "default";
const selected = document.querySelector(
        'input[name="theme"][value="' + currentTheme + '"]'
    );


if (selected)
{
    selected.checked = true;
}
    
function saveTheme(event)
{
    const theme = event.target.value;
    localStorage.setItem("theme", theme);
    applyTheme(theme);
}

function applyTextSize(size)
{
    if (!size)
    {
        size = "default";
    }

    const scale = {

        small:   0.85,
        default: 1.0,
        large:   1.2,
        xlarge:  1.4

    };

    document.documentElement.style.setProperty(
        "--scale",
        scale[size]

    );
}
    
    const menuButton = document.getElementById("menu-button");
    const burgerMenu = document.getElementById("burger-menu");
    
    const themeButtons = document.querySelectorAll('input[name="theme"]');

    for (const button of themeButtons)
    {
        button.addEventListener("change", saveTheme);
    }

    
    if (!menuButton || !burgerMenu) {
        return;
    }

    function openMenu() {

        burgerMenu.hidden = false;

    }

    function closeMenu() {

        burgerMenu.hidden = true;

    }

    function toggleMenu() {

        burgerMenu.hidden = !burgerMenu.hidden;

    }

    closeMenu();

    menuButton.addEventListener("click", function (event) {

        event.preventDefault();
        event.stopPropagation();

        toggleMenu();

    });

    burgerMenu.addEventListener("click", function (event) {

        event.stopPropagation();

    });

    document.addEventListener("click", function () {

        closeMenu();

    });
    
// wrap

createMeasureDiv();
wrapAllBlocks();

});


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

function insertUserNotes(data)
{
    if (!data.notes)
    {
        return;
    }

    for (const line in data.notes)
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


//
// Add line numbers to every lyric line.
//
function addLineNumbers()
{
    const lyrics = document.querySelectorAll(".lyrics");

    for (const line of lyrics)
    {
        const number = line.dataset.line;

        if (!number)
            continue;

        const span = document.createElement("span");

        span.className = "line-number";

        span.textContent = number ;

        line.prepend(span);
    }
}


/*----------------------------------------------------------*/
/* User Notes                                                */
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
                console.log(
                    filename +
                    " not found"
                );

                continue;
            }

            const notes =
                await response.json();

//            console.log(notes);
//            insertTopNotes(notes);  
               insertUserNotes(notes);
         
        }

        catch (error)
        {
            console.log(error);
        }
    }
}



/*----------------------------------------------------------*/
/* Note Rendering                                            */
/*----------------------------------------------------------*/

function insertTopNotes(notes)
{
    console.log("Insert top notes", notes);
}




