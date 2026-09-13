// alert("settings.js loaded");
// console.log("settings.js loaded");
//
// settings.js
//
// hhh-stomp
//


document.addEventListener("DOMContentLoaded", initialiseSettings);

function initialiseSettings()
{
    console.log("Initialising settings");

    initialiseBurgerMenu();
    initialiseHelpPopup();
    initialiseTheme();
    initialiseTextSize();
    initialiseBeatButton();

    attachStaticListeners();

    loadBand();
}

function attachStaticListeners()
{
    document
        .getElementById("show-chords")
        .addEventListener(
            "change",
            saveSettings
        );

    document
        .getElementById("show-line-numbers")
        .addEventListener(
            "change",
            saveSettings
        );

    document
        .getElementById("big-tempo")
        .addEventListener(
            "change",
            saveSettings
        );

    
     document
    .getElementById("beat-sound-enabled")
    .addEventListener(
        "change",
        saveSettings
    );   
        
        
        document
    .getElementById("show-auto-scroll-controls")
    .addEventListener(
        "change",
        saveSettings
    );
        
    const fontButtons =
        document.querySelectorAll(
            'input[name="fontsize"]'
        );

    for (const button of fontButtons)
    {
        button.addEventListener(
            "change",
            saveSettings
        );
    }
    
const stickyButtons =
    document.querySelectorAll(
        'input[name="section-stickiness"]'
    );

for (const button of stickyButtons)
{
    button.addEventListener(
        "change",
        saveSettings
    );
}

    const saveButton =
        document.getElementById(
            "save-settings"
        );

    if (saveButton)
    {
        saveButton.addEventListener(
            "click",
            saveSettings
        );
    }

    document
    .getElementById("clear-user-link")
    .addEventListener(
        "click",
        function(event)
        {
            event.preventDefault();

            localStorage.removeItem(
                "current-user"
            );

            window.location.href =
                "index.html";
        }
    );
    
    
}


function loadSettings()
{

     console.log("Loading settings");
     
    console.log("show-chords", document.getElementById("show-chords"));
    console.log("show-line-numbers", document.getElementById("show-line-numbers"));
    console.log("big-tempo", document.getElementById("big-tempo"));

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
    
    console.log(
    "Loaded big-tempo =",
    document.getElementById("big-tempo").checked
);

    
    const textSize =
    localStorage.getItem("text-size");

    if (textSize !== null)
    {
    const radio =
        document.querySelector(
            'input[name="fontsize"][value="' + textSize + '"]'
        );

    if (radio)
        {
        radio.checked = true;
        }
    }
    
    const beatSoundEnabled =
    localStorage.getItem(
        "song2html_beat_sound_enabled"
    ) === "true";

document.getElementById(
    "beat-sound-enabled"
).checked =
    beatSoundEnabled;
    
    
    
const sectionStickiness =
    localStorage.getItem(
        "section-stickiness"
    );

if (sectionStickiness !== null)
{
    const radio =
        document.querySelector(
            'input[name="section-stickiness"][value="' +
            sectionStickiness +
            '"]'
        );

    if (radio)
    {
        radio.checked = true;
    }
}    


    const members =
        document.querySelectorAll("#band-members input[type='checkbox']");

    for (const member of members)
    {
        const value =
            localStorage.getItem("notes-" + member.dataset.member);

        if (value !== null)
            {
            member.checked = (value === "true");
            }
    }

    
    const showAutoScrollControls =
    localStorage.getItem(
        "show-auto-scroll-controls"
    );

document.getElementById(
    "show-auto-scroll-controls"
).checked =
    showAutoScrollControls === "true";
    
    
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

    localStorage.setItem(
    "song2html_beat_sound_enabled",
    document.getElementById("beat-sound-enabled").checked
    );

    

const size =
    document.querySelector(
        'input[name="fontsize"]:checked'
    ).value;

localStorage.setItem(
    "text-size",
    size
);

applyTextSize(size);


const sectionStickiness =
    document.querySelector(
        'input[name="section-stickiness"]:checked'
    ).value;

localStorage.setItem(
    "section-stickiness",
    sectionStickiness
);

    
    localStorage.setItem(
    "show-auto-scroll-controls",
    document.getElementById(
        "show-auto-scroll-controls"
    ).checked
);

    
    const members =
        document.querySelectorAll("#band-members input[type='checkbox']");

    for (const member of members)
        {
            localStorage.setItem(
            "notes-" + member.dataset.member,
            member.checked
            );
        }    
    
    
}

// add band members

async function loadBand()
{
    
       
        try
        {

    console.log("Loading band.json");
    const response = await fetch("assets/band.json");
    const band = await response.json();
    populateBandMembers(band.members);

loadSettings();

attachMemberListeners();

        }
        
    catch (error)
        {
        console.error("Unable to load band.json", error);
        }

}


function attachMemberListeners()
{
    const members =
        document.querySelectorAll(
            "#band-members input[type='checkbox']"
        );

    for (const member of members)
    {
        member.addEventListener(
            "change",
            saveSettings
        );
    }
}



function populateBandMembers(members)
{
    const container = document.getElementById("band-members");
    container.innerHTML = "";

    for (const member of members)
    {
     const label =
    document.createElement("label");

    label.innerHTML =
    '<input type="checkbox" data-member="' +
    member +
    '"> ' +
    member;

    container.appendChild(label);
    container.appendChild(document.createElement("br"));

    label.querySelector("input")
     .addEventListener("change", saveSettings);

    }
    
    
}

// loadSettings();





