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
    
    initialiseUpdateControls();
    checkForUpdates();
    
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



/* =========================================================
   PWA UPDATE / CACHE MANAGEMENT
   ========================================================= */

const UPDATE_FILE = "assets/update.json";
const CATALOGUE_FILE = "assets/catalogue.json";
const BAND_FILE = "assets/band.json";

const UPDATE_TIME_KEY = "song2html-last-update";
const UPDATE_LOG_KEY = "song2html-update-log";
const UPDATE_LOG_SIZE = 3;


/*
 * Initialise the update controls.
 */
function initialiseUpdateControls() {

    const updateButton = document.getElementById("update-now");

    if (updateButton) {
        updateButton.addEventListener("click", updateNow);
    }

    showLastUpdate();
    showUpdateLog();
}


/*
 * Ask the browser to check whether a newer service worker
 * is available.
 *
 * This does NOT download all songs.
 * It simply checks for a newer application/service-worker
 * version in the background.
 */
async function checkForUpdates() {

    if (!("serviceWorker" in navigator)) {
        return;
    }

    try {

        const registration =
            await navigator.serviceWorker.getRegistration();

        if (!registration) {
            return;
        }

        await registration.update();

    } catch (error) {

        console.warn(
            "Song2HTML: background update check failed",
            error
        );
    }
}


/*
 * Manual "Update now".
 *
 * 1. Refresh application/install files through the service worker.
 * 2. Download the catalogue.
 * 3. Download all song HTML/JSON files.
 * 4. Record the last few successful downloads.
 */
async function updateNow() {

    const button = document.getElementById("update-now");

    if (button) {
        button.disabled = true;
    }

    setUpdateStatus("Updating...");

    try {

        /*
         * Get the active service worker.
         */
        const registration =
            await navigator.serviceWorker.getRegistration();

        if (!registration || !registration.active) {
            throw new Error("No active service worker");
        }


        /*
         * Tell the service worker to refresh the
         * application/install files.
         */
        const coreResults =
            await sendServiceWorkerMessage(
                registration.active,
                { type: "UPDATE_CORE" }
            );


        /*
         * Build the list of song/content files.
         */
        const contentFiles =
            await buildContentFileList();


        /*
         * Download/cache the content files.
         */
        
const contentResults =
    await sendServiceWorkerMessage(
        registration.active,
        {
            type: "UPDATE_CONTENT",
            files: contentFiles
        }
    );

    
        /*
         * Combine successful results.
         */
        const successfulFiles = [

            ...coreResults
                .filter(result => result.ok)
                .map(result => result.file),

            ...contentResults
                .filter(result => result.ok)
                .map(result => result.file)

        ];


        /*
         * Record the update.
         */
        recordUpdate(successfulFiles);


        const failedCount =
            coreResults.filter(result => !result.ok).length +
            contentResults.filter(result => !result.ok).length;


        if (failedCount > 0) {

            setUpdateStatus(
                `Update complete with ${failedCount} error(s).`
            );

        } else {

            setUpdateStatus(
                `Update complete — ${successfulFiles.length} files updated.`
            );
        }

        showLastUpdate();
        showUpdateLog();

    } catch (error) {

        console.error(
            "Song2HTML: update failed",
            error
        );

        setUpdateStatus(
            `Update failed: ${error.message}`
        );

    } finally {

        if (button) {
            button.disabled = false;
        }
    }
}


/*
 * Send a message to the service worker and wait for its reply.
 */

function sendServiceWorkerMessage(serviceWorker, message) {

    return new Promise((resolve, reject) => {

        const channel = new MessageChannel();

        const timeout =
            setTimeout(() => {

                reject(
                    new Error(
                        "Service worker update timed out"
                    )
                );

            }, 120000);


        channel.port1.onmessage = event => {

            const data = event.data;


            /*
             * Progress message.
             */
            if (data && data.type === "UPDATE_PROGRESS") {

                setUpdateStatus(
                    `Application files: ${data.current} / ${data.total}\n`  +
                    `Loading: ${data.file}`
                );

                return;
            }


            /*
             * Final response.
             */
            if (!data || data.type !== "UPDATE_COMPLETE") {
                return;
            }


            clearTimeout(timeout);


            if (!data.ok) {

                reject(
                    new Error(
                        data.error ||
                        "Service worker update failed"
                    )
                );

                return;
            }


            resolve(
                data.results || []
            );
        };


        serviceWorker.postMessage(
            message,
            [channel.port2]
        );
    });
}

/*
 * Build the list of content files that should be cached.
 */

async function buildContentFileList() {

    const files = [];

    /*
     * Load catalogue once.
     */
    const catalogueResponse =
        await fetch(
            CATALOGUE_FILE,
            { cache: "no-cache" }
        );

    if (!catalogueResponse.ok) {
        throw new Error(
            `Could not load ${CATALOGUE_FILE}: HTTP ${catalogueResponse.status}`
        );
    }

    const catalogue =
        await catalogueResponse.json();

    if (!Array.isArray(catalogue.songs)) {
        throw new Error(
            "catalogue.json does not contain a songs array"
        );
    }

    files.push(CATALOGUE_FILE);


    /*
     * Load band.json ONCE, not once per song.
     */
    let members = [];

    try {

        const bandResponse =
            await fetch(
                BAND_FILE,
                { cache: "no-cache" }
            );

        if (bandResponse.ok) {

            const band =
                await bandResponse.json();

            if (Array.isArray(band.members)) {
                members = band.members;
            }
        }

    } catch (error) {

        console.warn(
            "Song2HTML: could not load band.json",
            error
        );
    }


    /*
     * Build the song file list.
     */
    for (const song of catalogue.songs) {

        if (!song.file) {
            continue;
        }

        const htmlFile = song.file;

        files.push(htmlFile);


        /*
         * Normal song JSON.
         *
         * songs/My Song.html
         *       ->
         * songs/My Song.json
         */
        const jsonFile =
            htmlFile.replace(
                /\.html$/i,
                ".json"
            );

        files.push(jsonFile);


        /*
         * Personal member files.
         */
        const baseName =
            htmlFile
                .replace(/^songs\//, "")
                .replace(/\.html$/i, "");


        for (const member of members) {

            const memberFile =
                `songs/${baseName}.${member}.json`;

            if (await fileExists(memberFile)) {
                files.push(memberFile);
            }
        }
    }

        /*
     * Load saved setlist list.
     */
    const setlistsResponse =
        await fetch(
            "assets/all.setlists.json",
            { cache: "no-cache" }
        );

    if (!setlistsResponse.ok) {
        throw new Error(
            "Could not load assets/all.setlists.json"
        );
    }

    const setlists =
        await setlistsResponse.json();

    if (Array.isArray(setlists.setlists)) {

        for (const filename of setlists.setlists) {

            files.push(
                `setlists/${filename}`
            );
        }
    }
    
    

    /*
     * Remove duplicates.
     */
    return [...new Set(files)];
}


/*
 * Check whether a file exists.
 *
 * GET is used rather than HEAD because some cheap web
 * hosts do not handle HEAD reliably.
 */
async function fileExists(file) {

    try {

        const response =
            await fetch(
                file,
                {
                    cache: "no-cache"
                }
            );

        return response.ok;

    } catch (error) {

        return false;
    }
}


/*
 * Fetch content files.
 *
 * The service worker sees these requests and caches
 * successful responses.
 */

async function cacheContentFiles(files) {

    const results = [];

    for (let i = 0; i < files.length; i++) {

        const file = files[i];


        /*
         * Show content-file progress.
         */
        setUpdateStatus(
            `Song files: ${i + 1} / ${files.length}` +
            `Loading: ${file}`
        );


        try {

            const response =
                await fetch(
                    file,
                    { cache: "no-cache" }
                );

            if (!response.ok) {
                throw new Error(
                    `HTTP ${response.status}`
                );
            }

            results.push({
                file,
                ok: true
            });

        } catch (error) {

            console.warn(
                "Song2HTML: could not cache",
                file,
                error
            );

            results.push({
                file,
                ok: false,
                error: String(error)
            });
        }
    }

    return results;
}


/*
 * Save the update timestamp and the last few files.
 */
function recordUpdate(files) {

    const timestamp =
        new Date().toISOString();


    localStorage.setItem(
        UPDATE_TIME_KEY,
        timestamp
    );


    /*
     * Keep only the last three successful files.
     */
    const log =
        files
            .slice(-UPDATE_LOG_SIZE);


    localStorage.setItem(
        UPDATE_LOG_KEY,
        JSON.stringify(log)
    );
}


/*
 * Display last update time.
 */
function showLastUpdate() {

    const element =
        document.getElementById("last-updated");

    if (!element) {
        return;
    }


    const timestamp =
        localStorage.getItem(
            UPDATE_TIME_KEY
        );


    if (!timestamp) {

        element.textContent = "Never";
        return;
    }


    const date =
        new Date(timestamp);


    element.textContent =
        date.toLocaleString();
}


/*
 * Display the last three updated files.
 */
function showUpdateLog() {

    const element =
        document.getElementById("update-log");

    if (!element) {
        return;
    }


    let log = [];


    try {

        log =
            JSON.parse(
                localStorage.getItem(
                    UPDATE_LOG_KEY
                ) || "[]"
            );

    } catch (error) {

        log = [];
    }


    element.innerHTML = "";


    for (const file of log) {

        const line =
            document.createElement("div");

        line.textContent = file;

        element.appendChild(line);
    }
}


/*
 * Display update status text.
 */
function setUpdateStatus(message) {

    const element =
        document.getElementById("update-status");

    if (element) {
        element.textContent = message;
    }
}


