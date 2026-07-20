// ===============================
// Delivery Location Verification
// ===============================

let locationVerified = false;

const verifyBtn = document.getElementById("verifyLocation");

const continueBtn = document.getElementById("continueBtn");

const message = document.getElementById("locationMessage");

verifyBtn.addEventListener("click", () => {

    if (!navigator.geolocation) {

        alert("Geolocation is not supported.");

        return;

    }

    verifyBtn.innerHTML = "Checking Location...";

    navigator.geolocation.getCurrentPosition(

        async (position) => {

            const lat = position.coords.latitude;

            const lng = position.coords.longitude;

            document.getElementById("latitude").value = lat;

            document.getElementById("longitude").value = lng;

            const response = await fetch("/check-location", {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    lat,

                    lng

                })

            });

            const data = await response.json();

            if (data.allowed) {

                locationVerified = true;

                continueBtn.disabled = false;

                message.innerHTML =
                "✅ Delivery Available";

                message.style.color = "green";

            } else {

                locationVerified = false;

                continueBtn.disabled = true;

                message.innerHTML =
                "❌ Sorry! Delivery Available Only In Domchanch, Koderma.";

                message.style.color = "red";

            }

            verifyBtn.innerHTML = "📍 Verify Live Location";

        },

        () => {

            alert("Please Allow Location Permission.");

            verifyBtn.innerHTML = "📍 Verify Live Location";

        }

    );

});


// ===============================
// Address Form Submit
// ===============================

document.getElementById("addressForm")

.addEventListener("submit", async function (e) {

    e.preventDefault();

    if (!locationVerified) {

        alert("Please Verify Your Live Location.");

        return;

    }

    const formData = new FormData(this);

    const response = await fetch("/cart/save-address", {

        method: "POST",

        body: formData

    });

    if (response.ok) {

        window.location.href = "/payment";

    } else {

        alert("Unable To Save Address");

    }

});
