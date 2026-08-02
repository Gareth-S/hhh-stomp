//
// lyrics.js
//
// Version 0.2 - wrap
//
// hhh-stomp
//

// Burger Bar

document.addEventListener("DOMContentLoaded", function () {

    const menuButton = document.getElementById("menu-button");
    const burgerMenu = document.getElementById("burger-menu");

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


function createMeasureDiv()
    {
     // Create one hidden div used for measuring lyric wrapping.
    measure = document.createElement("div");

    measure.id = "measure";

    // Hide it from the user.
    // measure.hidden = true;
    
    measure.style.position = "absolute";
    measure.style.left = "-9999px";
    measure.style.visibility = "hidden";

    
    document.body.appendChild(measure);
       
    }

function  wrapAllBlocks()

    {
    const blocks = document.querySelectorAll(".chord-lyric");

    for (const block of blocks) {

        wrapChordLyric(block);

    }
        
    }


    /*
    function wrapChordLyric(block)
{
    
    const lyricText = lyrics.textContent;
    console.log("A");
    
    
    
    // Get the chord and lyric lines.
    const chords = block.querySelector(".chords");
    const lyrics = block.querySelector(".lyrics");

  //  const lyricText = lyrics.textContent;

    // Make the measuring div use the same text layout as the lyric line.
    const style = getComputedStyle(lyrics);

    console.log("B");

    measure.style.font = style.font;
    measure.style.lineHeight = style.lineHeight;
    measure.style.letterSpacing = style.letterSpacing;
    measure.style.wordSpacing = style.wordSpacing;

    measure.style.whiteSpace = "normal";
    measure.style.width = lyrics.clientWidth + "px";
    console.log("C");

    // We'll start measuring here next.
    // Build the lyric one word at a time until the browser wraps.
    const words = lyricText.split(" ");

    console.log("D");
    
    let line = "";
    let lastHeight = 0;

    console.log("E");
    
    for (const word of words) {

        line += word + " ";

        measure.textContent = line;
  
        // If the height increased, the browser wrapped.
        const height = measure.offsetHeight;
        
        console.log(line);
        console.log("height =", height);
        console.log("last   =", lastHeight);

 
       if (lastHeight !== 0 && height > lastHeight) {

            console.log("Browser wraps before:", word);

            break;

        }

        lastHeight = height;

    }
 }
*/
    
    
 
    
    
 function wrapChordLyric(block)
{
//    console.log("1");

    const chords = block.querySelector(".chords");
    const lyrics = block.querySelector(".lyrics");

//    console.log("2");

    const lyricText = lyrics.textContent;

//    console.log("3");

    const style = getComputedStyle(lyrics);

//    console.log("4");

    measure.style.font = style.font;
    measure.style.lineHeight = style.lineHeight;
    measure.style.letterSpacing = style.letterSpacing;
    measure.style.wordSpacing = style.wordSpacing;

    measure.style.whiteSpace = "normal";
    measure.style.width = lyrics.clientWidth + "px";

 //   console.log("5");
    
    
    

    /* moved to     function browserWrapPosition(text)

    const words = lyricText.split(" ");

 //   console.log("6");

    let line = "";
    let lastHeight = 0;

    for (const word of words) {

        console.log(word);

        line += word + " ";

        measure.textContent = line;

        const height = measure.offsetHeight;

//        console.log("8", height);

        if (lastHeight !== 0 && height > lastHeight) {

            console.log("WRAP BEFORE:", word);

            break;

        }

        lastHeight = height;
    }

//    console.log("9");

*/

    
}   



function browserWrapPosition(text)
{
    const words = text.split(" ");

    let line = "";
    let lastHeight = 0;

    for (const word of words) {

      console.log(word);
  
      line += word + " ";

        measure.textContent = line;

        const height = measure.offsetHeight;

        console.log("7", word);

        if (lastHeight !== 0 && height > lastHeight) {

            console.log("WRAP BEFORE:", word);

            return word;

        }

        lastHeight = height;

    }

    return null;
}   
