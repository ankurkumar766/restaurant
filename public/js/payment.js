// ================= UPI COPY =================

function copyUPI() {
    const upiId = "7667880272-2@ybl";

    navigator.clipboard.writeText(upiId)
        .then(() => {
            const button = document.querySelector(".copy-upi");
            const original = button.innerHTML;

            button.innerHTML =
                '<i class="fa-solid fa-check"></i>';

            setTimeout(() => {
                button.innerHTML = original;
            }, 1500);
        })
        .catch(() => {
            alert("UPI ID: " + upiId);
        });
}


// ================= OPEN PHONEPE / UPI =================

function openPhonePe() {
    const totalInput =
        document.getElementById("totalAmount");

    const total = totalInput.value;

    if (!total || Number(total) <= 0) {
        alert("Please add items to your order first.");
        return;
    }

    const upiLink =
        `upi://pay?pa=7667880272-2@ybl&pn=Ankur%20Kumar&am=${total}&cu=INR`;

    window.location.href = upiLink;
}


// ================= OPEN WHATSAPP =================

function openWhatsApp() {

    const total =
        document.getElementById("totalAmount").value;

    const message =
        `Hello, I am sending payment screenshot.%0A%0ATotal Amount: ₹${total}`;

    window.location.href =
        `https://wa.me/917667880272?text=${message}`;
}


// ================= LOAD ORDER =================

const order =
    JSON.parse(localStorage.getItem("order")) || [];

const container =
    document.getElementById("order-summary");

const hiddenOrder =
    document.getElementById("orderData");

const hiddenTotal =
    document.getElementById("totalAmount");

let total = 0;


if (order.length === 0) {

    container.innerHTML =
        "<p>Your bag is empty.</p>";

} else {

    order.forEach(item => {

        const subtotal =
            Number(item.price) *
            Number(item.quantity);

        total += subtotal;

        container.innerHTML += `

            <div class="summary-item">

                <div class="summary-left">

                    <h4>${item.title}</h4>

                    <p>
                        <b>Size:</b> ${item.variation}<br>
                        <b>Price:</b> ₹${item.price}
                    </p>

                </div>

                <div class="summary-right">
                    Qty : ${item.quantity}
                </div>

            </div>

        `;
    });
}


// ================= SET TOTAL =================

document.getElementById("grandTotal").innerHTML = total;

hiddenTotal.value = total;

hiddenOrder.value = JSON.stringify(order);


// ================= PLACE ORDER =================

document
    .getElementById("orderForm")
    .addEventListener("submit", async function (e) {

        e.preventDefault();

        // Empty cart check
        if (order.length === 0) {
            alert("Your bag is empty!");
            return;
        }

        const form = this;

        const orderButton =
            form.querySelector(".order-btn");

        const originalButton =
            orderButton.innerHTML;

        // ================= INSTANT LOADING MESSAGE =================

        orderButton.disabled = true;

        orderButton.innerHTML = `
            <span>
                <i class="fa-solid fa-spinner fa-spin"></i>
                Placing Order...
            </span>
        `;


        const formData = new FormData(form);


        try {

            // ==========================================
            // 1. PLACE ORDER FIRST
            // ==========================================

            const response =
                await fetch("/place-order", {
                    method: "POST",
                    body: formData
                });


            const result =
                await response.json();

            console.log(result);


            // ==========================================
            // ORDER SUCCESS
            // ==========================================

            if (result.success) {

                // TURANT USER KO SUCCESS MESSAGE
                alert("Order Placed Successfully! ✅\n\nYour order has been received.");

                // Cart clear
                localStorage.removeItem("order");


                // ==========================================
                // 2. EMAIL SEND BACKGROUND ME
                // ==========================================

                fetch("https://api.web3forms.com/submit", {
                    method: "POST",
                    body: formData
                })
                .then(() => {
                    console.log("Order email sent successfully");
                })
                .catch((err) => {
                    console.log("Email sending error:", err);
                });


                // ==========================================
                // 3. REDIRECT IMMEDIATELY
                // ==========================================

                window.location.href = "/my-orders";

            } else {

                alert(
                    result.error ||
                    result.message ||
                    "Order could not be placed."
                );

                orderButton.disabled = false;

                orderButton.innerHTML =
                    originalButton;
            }

        } catch (err) {

            console.error(err);

            alert(
                "Something went wrong. Please try again."
            );

            orderButton.disabled = false;

            orderButton.innerHTML =
                originalButton;
        }

    });