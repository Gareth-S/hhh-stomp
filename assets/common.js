//
// common.js
//
// Version 0.1
//
// Shared functions for Song2HTML
//

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
