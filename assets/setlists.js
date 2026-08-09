
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
        const link =
            document.createElement("a");

        link.href =
            song.file;

        link.textContent =
            song.title;

        link.className =
            "song-list-entry";

        container.appendChild(link);
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
        const link =
            document.createElement("a");

        link.href =
            song.file;

        link.textContent =
            song.title;

        link.className =
            "song-list-entry";
    
    
        link.innerHTML =
    '       <span class="song-drag-handle">☰</span>' + song.title;


        container.appendChild(link);
    }
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




