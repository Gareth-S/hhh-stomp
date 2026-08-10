
/*----------------------------------------------------------*/
/* Load catalogue of all songs                              */
/*----------------------------------------------------------*/


async function loadCatalogue()
{
    try
    {
        const response =
            await fetch(
                "assets/catalogue.json"
            );

        if (!response.ok)
        {
            throw new Error(
                "Could not load catalogue.json"
            );
        }

        const catalogue =
            await response.json();

        populateCatalogue(
            catalogue.songs
        );
    }
    catch (error)
    {
        console.error(
            "Catalogue error:",
            error
        );
    }
}


function populateCatalogue(songs)
{
    const container =
        document.getElementById(
            "all-songs"
        );

    if (!container)
    {
        return;
    }

    container.innerHTML = "";

    for (const song of songs)
    {
        const entry =
            document.createElement("div");

        entry.className =
            "song-list-entry";


        const handle =
            document.createElement("span");

        handle.className =
            "song-drag-handle";

        handle.textContent =
            "☰";


        const link =
            document.createElement("a");

        link.href =
            song.file;

        link.textContent =
            song.title;


        entry.appendChild(handle);
        entry.appendChild(link);

        container.appendChild(entry);
    }
}
        
        
 document.addEventListener(
    "DOMContentLoaded",
    async function ()
    {
        // Initialise shared UI used by this page.
        initialiseTheme();
        initialiseTextSize();
        initialiseBurgerMenu();


        await loadCatalogue();
        await loadCurrentSetlist();


        initialiseSortable();
        updateDuplicateMarkers();


        
        /*
        // Test collecting the current setlist.
        document
            .getElementById("save-setlist")
            .addEventListener(
                "click",
                function ()
                {
                    const songs =
                        collectSetlistFromEditor();

                    console.log(
                        JSON.stringify(
                            songs,
                            null,
                            4
                        )
                    );
                }
            );
            
          */  
            
/*----------------------------------------------------------*/
/*    Save current setlist                                  */
/*----------------------------------------------------------*/

document
    .getElementById("save-setlist")
    .addEventListener(
        "click",
        async function ()
        {
            const songs =
                collectSetlistFromEditor();


            /*
             * Ask for the name of the saved setlist.
             *
             * This is deliberately simple for V1.
             */
            const name =
                prompt(
                    "Save setlist as:"
                );


            if (!name)
            {
                return;
            }


            const data =
                {
                    filename: name,
                    songs: songs
                };


            /*
             * This fetch() is network/server dependent.
             *
             * The browser sends the setlist to the local
             * PHP server, which writes the JSON file.
             */
            try
            {
                const response =
                    await fetch(
                        "assets/save-setlist.php",
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
                        "Save failed: HTTP " +
                        response.status
                    );
                }


                const result =
                    await response.json();


                if (!result.success)
                {
                    throw new Error(
                        "Save failed"
                    );
                }


                console.log(
                    "Setlist saved:",
                    name
                );
            }
            catch (error)
            {
                console.error(
                    "Unable to save setlist:",
                    error
                );

                alert(
                    "Unable to save setlist."
                );
            }
        }
    );
    
    
    
    }
);    
    



/*----------------------------------------------------------*/
/* Load setlist                                             */
/*----------------------------------------------------------*/



async function loadCurrentSetlist()
{
    try
    {
        const response =
            await fetch(
                "assets/current.setlist.json"
            );

        if (!response.ok)
        {
            throw new Error(
                "Could not load current.setlist.json"
            );
        }

        const setlist =
            await response.json();

        populateSetlist(
            setlist.songs
        );
    }
    catch (error)
    {
        console.error(
            "Setlist error:",
            error
        );
    }
}


function populateSetlist(songs)
{
    const container =
        document.getElementById(
            "current-setlist"
        );

    if (!container)
    {
        return;
    }

    container.innerHTML = "";

    for (const song of songs)
    {
        const entry =
            document.createElement("div");

        entry.className =
            "song-list-entry";


        const handle =
            document.createElement("span");

        handle.className =
            "song-drag-handle";

        handle.textContent =
            "☰";


        const link =
            document.createElement("a");

        link.href =
            song.file;

        link.textContent =
            song.title;


        entry.appendChild(handle);
        entry.appendChild(link);

        container.appendChild(entry);
    }
}

function updateDuplicateMarkers()
{
    const setlist =
        document.getElementById(
            "current-setlist"
        );

    const catalogue =
        document.getElementById(
            "all-songs"
        );

    if (!setlist || !catalogue)
    {
        return;
    }


    /*
     * Use the song filename as the identity of a song.
     * Titles can change, but the filename should remain stable.
     */
    const counts = {};


    const setlistEntries =
        setlist.querySelectorAll(
            ".song-list-entry"
        );

    for (const entry of setlistEntries)
    {
        const link =
            entry.querySelector("a");

        if (!link)
        {
            continue;
        }

        const file =
            link.getAttribute("href");

        counts[file] =
            (counts[file] || 0) + 1;
    }


    /* Mark duplicate songs in the current setlist. */
    for (const entry of setlistEntries)
    {
        const link =
            entry.querySelector("a");

        if (!link)
        {
            continue;
        }

        const file =
            link.getAttribute("href");

        entry.classList.toggle(
            "setlist-duplicate",
            counts[file] > 1
        );
    }


    /* Mark songs in the catalogue which are already in the setlist. */
    const catalogueEntries =
        catalogue.querySelectorAll(
            ".song-list-entry"
        );

    for (const entry of catalogueEntries)
    {
        const link =
            entry.querySelector("a");

        if (!link)
        {
            continue;
        }

        const file =
            link.getAttribute("href");

        entry.classList.toggle(
            "in-current-setlist",
            !!counts[file]
        );
    }
}


/*----------------------------------------------------------*/
/*    Collect current setlist                                */
/*----------------------------------------------------------*/

function collectSetlistFromEditor()
{
    const setlist =
        document.getElementById(
            "current-setlist"
        );

    const songs = [];

    if (!setlist)
    {
        return songs;
    }

    const entries =
        setlist.querySelectorAll(
            ".song-list-entry"
        );

    for (const entry of entries)
    {
        const link =
            entry.querySelector("a");

        if (!link)
        {
            continue;
        }

        const title =
            link.textContent.trim();

        const file =
            link.getAttribute("href");

        if (!title || !file)
        {
            continue;
        }

        songs.push(
            {
                title: title,
                file: file
            }
        );
    }

    return songs;
}


/*----------------------------------------------------------*/
/*    initialise SortableJS                                 */
/*----------------------------------------------------------*/

function initialiseSortable()
{
    const catalogue =
        document.getElementById(
            "all-songs"
        );

    const setlist =
        document.getElementById(
            "current-setlist"
        );

    if (!catalogue || !setlist)
    {
        return;
    }

    // Catalogue is the source list.
    // Songs are cloned into the setlist rather than removed
    // from the catalogue.
    new Sortable(
        catalogue,
        {
            group: {
                name: "songs",
                pull: "clone",
                put: false
            },

            sort: false
        }
    );


    // Current setlist accepts cloned songs and can be reordered.
    new Sortable(
        setlist,
        {
            group: {
                name: "songs",
                pull: true,
                put: true
            },

            sort: true,

            handle: ".song-drag-handle"
        }
    );
}




