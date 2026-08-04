// alert("settings.js loaded");
// console.log("settings.js loaded");
//
// settings.js
//
// Version 0.2-band mebers
//
// hhh-stomp
//

document.addEventListener("DOMContentLoaded", initialiseSettings);

function initialiseSettings()
{
    console.log("Initialising settings");
    initialiseBurgerMenu();

    document
        .getElementById("show-chords")
        .addEventListener("change", saveSettings);
    
    document
        .getElementById("show-line-numbers")
        .addEventListener("change", saveSettings);

    document
        .getElementById("big-tempo")
        .addEventListener("change", saveSettings);
        
    const fontButtons =
        document.querySelectorAll(
        'input[name="fontsize"]'
        );

    for (const button of fontButtons)
    {
        button.addEventListener("change", saveSettings);
    }
    
    loadBand();

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
    "text-size",
    document.querySelector('input[name="fontsize"]:checked'

    ).value

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
        
    catch (error)
        {
        console.error("Unable to load band.json", error);
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

loadSettings();





