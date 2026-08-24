document.addEventListener("DOMContentLoaded", function () {


    /* =========================================
       HALF / FULL SIZE
    ========================================= */

    document
        .querySelectorAll(".food-card")
        .forEach(function (card) {


            const buttons =
                card.querySelectorAll(".size-btn");


            const foodPrice =
                card.querySelector(".food-price");


            const variationInput =
                card.querySelector(".variationInput");


            const priceInput =
                card.querySelector(".priceInput");


            buttons.forEach(function (btn) {


                btn.addEventListener(
                    "click",
                    function () {


                        buttons.forEach(function (button) {

                            button.classList.remove("active");

                        });


                        this.classList.add("active");


                        const selectedPrice =
                            this.dataset.price;


                        const selectedType =
                            this.dataset.type;


                        if (foodPrice) {

                            foodPrice.textContent =
                                selectedPrice;

                        }


                        if (variationInput) {

                            variationInput.value =
                                selectedType;

                        }


                        if (priceInput) {

                            priceInput.value =
                                selectedPrice;

                        }


                    }
                );


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


        toggleMenuBtn.addEventListener(
            "click",
            function () {


                menuOpened = !menuOpened;


                extraMenus.forEach(function (menu) {


                    if (menuOpened) {


                        menu.classList.remove(
                            "hidden-menu"
                        );


                        menu.classList.add(
                            "show-menu"
                        );


                    } else {


                        menu.classList.remove(
                            "show-menu"
                        );


                        menu.classList.add(
                            "hidden-menu"
                        );


                    }


                });


                if (menuOpened) {


                    btnText.textContent =
                        "Show Less";


                    btnIcon.classList.remove(
                        "fa-chevron-down"
                    );


                    btnIcon.classList.add(
                        "fa-chevron-up"
                    );


                } else {


                    btnText.textContent =
                        "View More Menu";


                    btnIcon.classList.remove(
                        "fa-chevron-up"
                    );


                    btnIcon.classList.add(
                        "fa-chevron-down"
                    );


                    document
                        .getElementById("menu")
                        .scrollIntoView({

                            behavior: "smooth",

                            block: "start"

                        });


                }


            }
        );


    }



    /* =========================================
       SEARCH FOOD
    ========================================= */

    const searchInput =
        document.getElementById("searchInput");


    const noResult =
        document.getElementById("noResult");


    const menuItems =
        document.querySelectorAll(".menu-item");


    if (searchInput) {


        searchInput.addEventListener(
            "input",
            function () {


                const query =
                    this.value
                        .trim()
                        .toLowerCase();


                let foundCount = 0;


                /* =========================
                   EMPTY SEARCH
                ========================= */

                if (query === "") {


                    menuItems.forEach(
                        function (item, index) {


                            item.style.display = "";


                            if (index >= 8) {


                                item.classList.add(
                                    "hidden-menu"
                                );


                                item.classList.remove(
                                    "show-menu"
                                );


                            }


                        }
                    );


                    if (toggleMenuBtn) {


                        menuOpened = false;


                        const btnText =
                            toggleMenuBtn.querySelector(
                                ".btn-text"
                            );


                        const btnIcon =
                            toggleMenuBtn.querySelector(
                                "i"
                            );


                        btnText.textContent =
                            "View More Menu";


                        btnIcon.classList.remove(
                            "fa-chevron-up"
                        );


                        btnIcon.classList.add(
                            "fa-chevron-down"
                        );


                        toggleMenuBtn.style.display =
                            "inline-flex";


                    }


                    if (noResult) {

                        noResult.style.display =
                            "none";

                    }


                    return;


                }



                /* =========================
                   SEARCH MODE
                ========================= */

                if (toggleMenuBtn) {

                    toggleMenuBtn.style.display =
                        "none";

                }


                menuItems.forEach(
                    function (item) {


                        const titleElement =
                            item.querySelector(
                                ".card-title"
                            );


                        const title =
                            titleElement
                                ? titleElement
                                    .textContent
                                    .toLowerCase()
                                : "";


                        if (
                            title.includes(query)
                        ) {


                            item.style.display = "";


                            item.classList.remove(
                                "hidden-menu"
                            );


                            item.classList.add(
                                "show-menu"
                            );


                            foundCount++;


                        } else {


                            item.style.display =
                                "none";


                        }


                    }
                );



                /* =========================
                   NO RESULT
                ========================= */

                if (noResult) {


                    if (foundCount === 0) {


                        noResult.style.display =
                            "block";


                    } else {


                        noResult.style.display =
                            "none";


                    }


                }


            }
        );


    }



    /* =========================================
       AI ASSISTANT DRAG
    ========================================= */

    const assistant =
        document.getElementById("aiAssistant");


    if (assistant) {


        let isDragging = false;

        let startX = 0;

        let startY = 0;

        let offsetX = 0;

        let offsetY = 0;


        function startDrag(
            clientX,
            clientY
        ) {


            isDragging = true;


            const rect =
                assistant.getBoundingClientRect();


            offsetX =
                clientX - rect.left;


            offsetY =
                clientY - rect.top;


            assistant.style.animation =
                "none";


        }



        function moveDrag(
            clientX,
            clientY
        ) {


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