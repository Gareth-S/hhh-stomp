//
// common.js
//
// Version 0.1
//
// Shared functions for Song2HTML
//

console.log("common.js loaded");

/*----------------------------------------------------------*/
/* Local Storage                                             */
/*----------------------------------------------------------*/

function getSetting(name, defaultValue = null)
{
    const value = localStorage.getItem(name);

    return (value === null) ? defaultValue : value;
}

function setSetting(name, value)
{
    localStorage.setItem(name, value);
}

/*----------------------------------------------------------*/
/* Theme Handling                                            */
/*----------------------------------------------------------*/

function applyTheme(themeName)
{
    if (!themeName)
    {
        themeName = "default";
    }

    document.body.classList.remove(
        "default-theme",
        "light-theme",
        "dark-theme"
    );

    document.body.classList.add(themeName + "-theme");
}

function saveTheme(event)
{
    const theme = event.target.value;

    setSetting("theme", theme);

    applyTheme(theme);
}

function initialiseTheme()
{
    const theme = getSetting("theme", "default");

    applyTheme(theme);

    const selected =
        document.querySelector(
            'input[name="theme"][value="' + theme + '"]'
        );

    if (selected)
    {
        selected.checked = true;
    }

    const buttons =
        document.querySelectorAll('input[name="theme"]');

    for (const button of buttons)
    {
        button.addEventListener("change", saveTheme);
    }
}

/*----------------------------------------------------------*/
/* Text Size                                                 */
/*----------------------------------------------------------*/

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

function initialiseTextSize()
{
    applyTextSize(getSetting("text-size", "default"));
}

/*----------------------------------------------------------*/
/* Burger Menu                                               */
/*----------------------------------------------------------*/

function initialiseBurgerMenu()
{
    const menuButton = document.getElementById("menu-button");
    const burgerMenu = document.getElementById("burger-menu");

    if (!menuButton || !burgerMenu)
    {
        return;
    }

    function closeMenu()
    {
        console.log("closeMenu()");
        burgerMenu.hidden = true;
    }

    function toggleMenu()
    {
        burgerMenu.hidden = !burgerMenu.hidden;
    }

    closeMenu();

    menuButton.addEventListener("click", function (event)
    {
        event.preventDefault();
        event.stopPropagation();

        toggleMenu();
    });

    burgerMenu.addEventListener("click", function (event)
    {
        event.stopPropagation();
    });

    document.addEventListener("click", function ()
    {
        closeMenu();
    });
}

/*
 * Initialise the Help popup.
 *
 * The popup is used by both the Settings and Set Lists pages.
 */
function initialiseHelpPopup()
{
    const helpLink =
        document.getElementById(
            "help-link"
        );

    const overlay =
        document.getElementById(
            "help-overlay"
        );

    const closeButton =
        document.getElementById(
            "help-close"
        );

    if (
        !helpLink ||
        !overlay ||
        !closeButton
    )
    {
        return;
    }

    /*
     * Open the Help popup.
     */
    helpLink.addEventListener(
        "click",
        function (event)
        {
            event.preventDefault();

            overlay.classList.add(
                "help-visible"
            );
        }
    );

    /*
     * Close using the X button.
     */
    closeButton.addEventListener(
        "click",
        function ()
        {
            overlay.classList.remove(
                "help-visible"
            );
        }
    );

    /*
     * Close when clicking/touching outside
     * the actual popup.
     */
    overlay.addEventListener(
        "click",
        function (event)
        {
            if (
                event.target === overlay
            )
            {
                overlay.classList.remove(
                    "help-visible"
                );
            }
        }
    );
}

// Screen Wake Lock

let wakeLock = null;

async function enableWakeLock() {
    if (!("wakeLock" in navigator)) return;

    try {
        wakeLock = await navigator.wakeLock.request("screen");

        wakeLock.addEventListener("release", () => {
            wakeLock = null;
        });
    } catch (err) {
        console.log("Wake Lock unavailable:", err);
    }
}

async function disableWakeLock() {
    if (wakeLock) {
        await wakeLock.release();
        wakeLock = null;
    }
}

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && wakeLock === null) {
        enableWakeLock();
    }
});


// clean song path

function cleanSongPath(path)
{
    if (!path)
    {
        return "";
    }

    return path
        .split("?")[0]
        .split("#")[0];
}
