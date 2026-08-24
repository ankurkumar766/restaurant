document.addEventListener("DOMContentLoaded", function () {

    /* =========================================
       HALF / FULL SIZE
    ========================================= */

    document.querySelectorAll(".food-card").forEach(function (card) {

        const buttons = card.querySelectorAll(".size-btn");
        const foodPrice = card.querySelector(".food-price");
        const variationInput = card.querySelector(".variationInput");
        const priceInput = card.querySelector(".priceInput");

        buttons.forEach(function (btn) {

            btn.addEventListener("click", function () {

                buttons.forEach(function (button) {
                    button.classList.remove("active");
                });

                this.classList.add("active");

                const selectedPrice = this.dataset.price;
                const selectedType = this.dataset.type;

                if (foodPrice) {
                    foodPrice.textContent = selectedPrice;
                }

                if (variationInput) {
                    variationInput.value = selectedType;
                }

                if (priceInput) {
                    priceInput.value = selectedPrice;
                }

            });

        });

    });



    /* =========================================
       VIEW MORE / SHOW LESS
    ========================================= */

    const toggleMenuBtn =
        document.getElementById("toggleMenuBtn");

    const extraMenus =
        document.querySelectorAll(".extra-menu");

    let menuOpened = false;

    if (toggleMenuBtn) {

        const btnText =
            toggleMenuBtn.querySelector(".btn-text");

        const btnIcon =
            toggleMenuBtn.querySelector("i");

        toggleMenuBtn.addEventListener("click", function () {

            menuOpened = !menuOpened;

            extraMenus.forEach(function (menu) {

                if (menuOpened) {

                    menu.classList.remove("hidden-menu");
                    menu.classList.add("show-menu");

                } else {

                    menu.classList.remove("show-menu");
                    menu.classList.add("hidden-menu");

                }

            });


            if (menuOpened) {

                if (btnText) {
                    btnText.textContent = "Show Less";
                }

                if (btnIcon) {

                    btnIcon.classList.remove(
                        "fa-chevron-down"
                    );

                    btnIcon.classList.add(
                        "fa-chevron-up"
                    );

                }

            } else {

                if (btnText) {
                    btnText.textContent =
                        "View More Menu";
                }

                if (btnIcon) {

                    btnIcon.classList.remove(
                        "fa-chevron-up"
                    );

                    btnIcon.classList.add(
                        "fa-chevron-down"
                    );

                }

            }

        });

    }



    /* =========================================
       SEARCH FOOD
    ========================================= */

    const searchInputs =
        document.querySelectorAll("#searchInput");

    const noResult =
        document.getElementById("noResult");

    const menuItems =
        document.querySelectorAll(".menu-item");


   function searchFood(searchValue) {
    const query = searchValue.trim().toLowerCase();
    const menuContainer = document.getElementById("menuContainer");

    let foundItems = [];
    let notFoundItems = [];

    // =========================
    // EMPTY SEARCH
    // =========================
    if (query === "") {

        menuItems.forEach(function (item) {
            item.style.display = "";

            if (item.classList.contains("extra-menu")) {
                item.classList.remove("show-menu");
                item.classList.add("hidden-menu");
            }

            // Original order restore karne ke liye
            menuContainer.appendChild(item);
        });

        menuOpened = false;

        if (toggleMenuBtn) {
            toggleMenuBtn.style.display = "inline-flex";

            const btnText =
                toggleMenuBtn.querySelector(".btn-text");

            const btnIcon =
                toggleMenuBtn.querySelector("i");

            if (btnText) {
                btnText.textContent = "View More Menu";
            }

            if (btnIcon) {
                btnIcon.classList.remove("fa-chevron-up");
                btnIcon.classList.add("fa-chevron-down");
            }
        }

        if (noResult) {
            noResult.style.display = "none";
        }

        return;
    }


    // =========================
    // SEARCH MODE
    // =========================

    if (toggleMenuBtn) {
        toggleMenuBtn.style.display = "none";
    }

    menuItems.forEach(function (item) {

        const titleElement =
            item.querySelector(".card-title");

        const title =
            titleElement
                ? titleElement.textContent
                    .trim()
                    .toLowerCase()
                : "";

        if (title.includes(query)) {

            item.style.display = "";

            item.classList.remove("hidden-menu");
            item.classList.add("show-menu");

            foundItems.push(item);

        } else {

            item.style.display = "none";

            notFoundItems.push(item);
        }
    });


    // =========================
    // MATCHING CARD TOP PAR
    // =========================

    foundItems.forEach(function (item) {
        menuContainer.prepend(item);
    });


    // =========================
    // NO RESULT
    // =========================

    if (noResult) {

        if (foundItems.length === 0) {
            noResult.style.display = "block";
        } else {
            noResult.style.display = "none";
        }

    }
}



    /* =========================================
       SEARCH INPUT EVENTS
    ========================================= */

    searchInputs.forEach(function (input) {

        input.addEventListener("input", function () {

            const value = this.value;


            /* Agar 2 search inputs hain,
               dono ko same value rakhega */

            searchInputs.forEach(function (otherInput) {

                if (otherInput !== input) {

                    otherInput.value = value;

                }

            });


            searchFood(value);

        });

    });



    /* =========================================
       ACTIVE NAVIGATION
    ========================================= */

    const currentPath =
        window.location.pathname
            .replace(/\/$/, "");


    document.querySelectorAll(".nav-item")
        .forEach(function (link) {

            let linkPath =
                link.getAttribute("href");


            if (!linkPath) return;


            linkPath =
                linkPath.replace(/\/$/, "");


            /* Home route */

            const isHome =
                (currentPath === "" ||
                 currentPath === "/" ||
                 currentPath === "/listings") &&

                (linkPath === "" ||
                 linkPath === "/" ||
                 linkPath === "/listings");


            if (
                currentPath === linkPath ||
                isHome
            ) {

                link.classList.add("active");

            }

        });



    /* =========================================
       AI ASSISTANT DRAG
    ========================================= */

    const assistant =
        document.getElementById("aiAssistant");


    if (assistant) {

        let isDragging = false;

        let offsetX = 0;

        let offsetY = 0;


        function startDrag(clientX, clientY) {

            isDragging = true;

            const rect =
                assistant.getBoundingClientRect();

            offsetX =
                clientX - rect.left;

            offsetY =
                clientY - rect.top;

            assistant.style.animation = "none";

        }


        function moveDrag(clientX, clientY) {

            if (!isDragging) return;


            let x =
                clientX - offsetX;

            let y =
                clientY - offsetY;


            const maxX =
                window.innerWidth -
                assistant.offsetWidth;

            const maxY =
                window.innerHeight -
                assistant.offsetHeight;


            x = Math.max(
                0,
                Math.min(x, maxX)
            );


            y = Math.max(
                0,
                Math.min(y, maxY)
            );


            assistant.style.left =
                x + "px";

            assistant.style.top =
                y + "px";

            assistant.style.right =
                "auto";

            assistant.style.bottom =
                "auto";

        }


        function stopDrag() {

            isDragging = false;

        }


        /* DESKTOP */

        assistant.addEventListener(
            "mousedown",
            function (e) {

                e.preventDefault();

                startDrag(
                    e.clientX,
                    e.clientY
                );

            }
        );


        document.addEventListener(
            "mousemove",
            function (e) {

                moveDrag(
                    e.clientX,
                    e.clientY
                );

            }
        );


        document.addEventListener(
            "mouseup",
            function () {

                stopDrag();

            }
        );


        /* MOBILE */

        assistant.addEventListener(
            "touchstart",
            function (e) {

                const touch =
                    e.touches[0];

                startDrag(
                    touch.clientX,
                    touch.clientY
                );

            },
            {
                passive: true
            }
        );


        document.addEventListener(
            "touchmove",
            function (e) {

                if (!isDragging) return;

                const touch =
                    e.touches[0];

                moveDrag(
                    touch.clientX,
                    touch.clientY
                );

            },
            {
                passive: true
            }
        );


        document.addEventListener(
            "touchend",
            function () {

                stopDrag();

            }
        );

    }

});