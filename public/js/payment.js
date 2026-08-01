                     function openPhonePe() {
    const total = document.getElementById("totalAmount").value;

    const upiLink = `upi://pay?pa=7667880272-2@ybl&pn=Ankur%20Kumar&am=${total}&cu=INR`;

    window.location.href = upiLink;
}

                    function openWhatsApp() {

                        window.location.href =
                            "https://wa.me/917667880272?text=Hello%20I%20am%20sending%20payment%20screenshot";

                    }


                    // ================= LOAD ORDER =================

                    const order = JSON.parse(localStorage.getItem("order")) || [];

                    const container = document.getElementById("order-summary");

                    const hiddenOrder = document.getElementById("orderData");

                    const hiddenTotal = document.getElementById("totalAmount");

                    let total = 0;

                    if (order.length === 0) {

                        container.innerHTML = "<p>Your bag is empty.</p>";

                    } else {

                        order.forEach(item => {

                            const subtotal = Number(item.price) * Number(item.quantity);

                            total += subtotal;

                            container.innerHTML += `

        <div class="summary-item">

            <div class="summary-left">

                <h4>${item.title}</h4>

                <p>₹${item.price}</p>

            </div>

            <div class="summary-right">

                Qty : ${item.quantity}

            </div>

        </div>

        `;

                        });

                    }

                    document.getElementById("grandTotal").innerHTML = "₹" + total;

                    hiddenTotal.value = total;

                    hiddenOrder.value = JSON.stringify(order);


                    // ================= PLACE ORDER =================

                    document.getElementById("orderForm").addEventListener("submit", async function (e) {

                        e.preventDefault();

                        const formData = new FormData(this);

                        try {

                            await fetch("/cart/save-address", {

                                method: "POST",

                                body: formData

                            });

                            await fetch("https://api.web3forms.com/submit", {

                                method: "POST",

                                body: formData

                            });

                            const response = await fetch("/place-order", {

                                method: "POST",

                                body: formData

                            });

                            const result = await response.json();

                            if (result.success) {

                                localStorage.removeItem("order");

                                alert("Order Placed Successfully ✅");

                                window.location.href = "/my-orders";

                            } else {

                                alert("Order Failed ❌");

                            }

                        } catch (err) {

                            alert("Something Went Wrong");

                        }

                    });
