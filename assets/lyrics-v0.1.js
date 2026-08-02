//
// lyrics.js
//
// Version 0.1 -bb
//
// hhh-stomp
//

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

});


