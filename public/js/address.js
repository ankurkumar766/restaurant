// =====================================================
// ADDRESS FORM
// =====================================================

const addressForm = document.getElementById("addressForm");

const continueBtn = document.getElementById("continueBtn");

const message = document.getElementById("locationMessage");



addressForm.addEventListener("submit", async function (e) {

    e.preventDefault();


    const address =
        document.getElementById("address").value.trim();



    // ================================================
    // Empty address check
    // ================================================

    if (!address) {

        message.innerHTML =
            "❌ Please enter your delivery address.";

        message.style.color = "red";

        return;

    }



    // ================================================
    // Button loading
    // ================================================

    continueBtn.disabled = true;

    continueBtn.innerHTML =
        "Checking Delivery Area...";



    message.innerHTML =
        "Checking your delivery address...";

    message.style.color = "#555";



    try {


        const formData =
            new FormData(addressForm);



        // ================================================
        // SEND ADDRESS TO SERVER
        // ================================================

        const response = await fetch(
            "/cart/save-address",
            {
                method: "POST",
                body: formData
            }
        );



        const data = await response.json();



        // ================================================
        // SUCCESS
        // ================================================

        if (response.ok && data.success) {


            message.innerHTML =
                "✅ Delivery available at your address.";

            message.style.color = "green";



            setTimeout(() => {

                window.location.href =
                    "/payment";

            }, 500);


        }


        // ================================================
        // DELIVERY NOT AVAILABLE
        // ================================================

        else {


            message.innerHTML =
                "❌ " +
                (
                    data.error ||
                    "Sorry! Delivery is not available at this address."
                );

            message.style.color = "red";


            continueBtn.disabled = false;

            continueBtn.innerHTML =
                "Continue To Payment →";

        }


    } catch (error) {


        console.log(error);


        message.innerHTML =
            "❌ Something went wrong. Please try again.";

        message.style.color = "red";


        continueBtn.disabled = false;

        continueBtn.innerHTML =
            "Continue To Payment →";

    }

});