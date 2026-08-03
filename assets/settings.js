// alert("settings.js loaded");
// console.log("settings.js loaded");
//
// settings.js
//
// Version 0.1
//
// hhh-stomp
//

document.addEventListener("DOMContentLoaded", initialiseSettings);

function initialiseSettings()
{
    console.log("Initialising settings");

    loadSettings();
    
    document
        .getElementById("show-chords")
        .addEventListener("change", saveSettings);
    
    document
        .getElementById("show-line-numbers")
        .addEventListener("change", saveSettings);

    document
        .getElementById("big-tempo")
        .addEventListener("change", saveSettings);

}



function loadSettings()
{

     console.log("Loading settings");

    const showChords =
        localStorage.getItem("show-chords");

    if (showChords !== null)
    {
        document.getElementById("show-chords").checked =
            (showChords === "true");
    }
    
    const showLineNumbers =
    localStorage.getItem("show-line-numbers");

    if (showLineNumbers !== null)
    {
        document.getElementById("show-line-numbers").checked =
            (showLineNumbers === "true");
    }

    const bigTempo =
    localStorage.getItem("big-tempo");

    if (bigTempo !== null)
    {
        document.getElementById("big-tempo").checked =
            (bigTempo === "true");
    }
    
}

function saveSettings()
{
    console.log("Saving settings");
    localStorage.setItem(
        "show-chords",
        document.getElementById("show-chords").checked

    );
    
    localStorage.setItem(
    "show-line-numbers",
    document.getElementById("show-line-numbers").checked

    );
    
    localStorage.setItem(
    "big-tempo",
    document.getElementById("big-tempo").checked
        
    );  
    
}
