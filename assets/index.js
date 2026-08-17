/*
 * index.js
 *
 * Gateway page for Song2HTML.
 *
 * Reads the band members from band.json and creates
 * the "Choose Yourself" buttons.
 */

document.addEventListener(
    "DOMContentLoaded",
    loadWelcomeBand
);


/*
 * Load band information.
 */
async function loadWelcomeBand()
{
    try
    {
        const response =
            await fetch(
                "assets/band.json?ts=" +
                Date.now()
            );

        if (!response.ok)
        {
            throw new Error(
                "Could not load band.json"
            );
        }

        const band =
            await response.json();

        populateUserButtons(
            band.members
        );
    }
    catch (error)
    {
        console.error(
            "Welcome page error:",
            error
        );
    }
}


/*
 * Create the user buttons.
 */
function populateUserButtons(members)
{
    const container =
        document.getElementById(
            "user-buttons"
        );

    if (!container)
    {
        return;
    }

    container.innerHTML = "";

    /*
     * Use three columns when there are more
     * than five band members.
     */
    if (members.length > 5)
    {
        container.classList.add(
            "three-columns"
        );
    }
    else
    {
        container.classList.remove(
            "three-columns"
        );
    }

    for (const member of members)
    {
        const button =
            document.createElement(
                "button"
            );

        button.type =
            "button";

 button.textContent =
    member;


/*
 * Select this user.
 */

button.addEventListener(
    "click",
    function ()
    {
        /*
         * Remember who selected themselves.
         */
        localStorage.setItem(
            "current-user",
            member
        );


        /*
         * Set the default display settings.
         */
        localStorage.setItem(
            "text-size",
            "default"
        );

        localStorage.setItem(
            "show-chords",
            "true"
        );

        localStorage.setItem(
            "show-line-numbers",
            "false"
        );

        localStorage.setItem(
            "big-tempo",
            "false"
        );


        /*
         * Clear all note selections first.
         *
         * The Settings page stores these as:
         *
         * notes-Gareth
         * notes-Tom
         * notes-Dick
         * etc.
         *
         * We will then enable only the selected user.
         */
        for (const otherMember of members)
        {
            localStorage.setItem(
                "notes-" + otherMember,
                "false"
            );
        }

        localStorage.setItem(
            "notes-" + member,
            "true"
        );


        console.log(
            "Current user:",
            member
        );

        console.log(
            "User defaults applied"
        );


        /*
         * Continue to the setlists page.
         */
        window.location.href =
            "setlists.html";
    }
);

container.appendChild(
    button
        );
    }
}
