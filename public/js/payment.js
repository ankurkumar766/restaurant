// =====================================================
// LOAD ORDER FROM LOCAL STORAGE
// =====================================================
const order = JSON.parse(localStorage.getItem("order")) || [];
const container = document.getElementById("order-summary");
const hiddenOrder = document.getElementById("orderData");
const hiddenTotal = document.getElementById("totalAmount");
const grandTotal = document.getElementById("grandTotal");
const razorpayAmount = document.getElementById("razorpayAmount");

let total = 0;

// =====================================================
// SHOW ORDER & CALCULATE TOTAL
// =====================================================
if (order.length === 0) {
    if (container) container.innerHTML = "<p>Your bag is empty.</p>";
} else {
    if (container) {
        container.innerHTML = "";
        order.forEach(item => {
            const subtotal = Number(item.price) * Number(item.quantity);
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
}

// =====================================================
// SET TOTAL IN DOM & HIDDEN INPUTS
// =====================================================
if (grandTotal) grandTotal.innerHTML = total;
if (hiddenTotal) hiddenTotal.value = total;
if (hiddenOrder) hiddenOrder.value = JSON.stringify(order);
if (razorpayAmount) razorpayAmount.innerText = total;

// =====================================================
// HELPER FUNCTIONS: UPI, PHONEPE & WHATSAPP
// =====================================================
function copyUPI() {
    const upiId = "7667880272-2@ybl";
    navigator.clipboard.writeText(upiId)
        .then(() => {
            const button = document.querySelector(".copy-upi");
            if (button) {
                const original = button.innerHTML;
                button.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                setTimeout(() => {
                    button.innerHTML = original;
                }, 1500);
            }
        })
        .catch(() => {
            alert("UPI ID: " + upiId);
        });
}

function openPhonePe() {
    const currentTotal = hiddenTotal ? hiddenTotal.value : total;
    if (!currentTotal || Number(currentTotal) <= 0) {
        alert("Please add items to your order first.");
        return;
    }
    const upiLink = `upi://pay?pa=7667880272-2@ybl&pn=Ankur%20Kumar&am=${currentTotal}&cu=INR`;
    window.location.href = upiLink;
}

function openWhatsApp() {
    const currentTotal = hiddenTotal ? hiddenTotal.value : total;
    const message = `Hello, I am sending payment screenshot.%0A%0ATotal Amount: ₹${currentTotal}`;
    window.location.href = `https://wa.me/917667880272?text=${message}`;
}

// =====================================================
// FORM & BUTTON REFERENCES
// =====================================================
const orderForm = document.getElementById("orderForm");
const razorpayBtn = document.getElementById("razorpayBtn");

if (razorpayBtn) {
    razorpayBtn.addEventListener("click", startRazorpayPayment);
}

// =====================================================
// RESET RAZORPAY BUTTON
// =====================================================
function resetRazorpayButton() {
    if (!razorpayBtn) return;
    razorpayBtn.disabled = false;
    razorpayBtn.innerHTML = `
        <i class="fa-solid fa-lock"></i>
        Pay ₹<span id="razorpayAmount">${total}</span>
    `;
}

// =====================================================
// START RAZORPAY PAYMENT
// =====================================================
async function startRazorpayPayment() {
    if (order.length === 0) {
        alert("Your bag is empty!");
        return;
    }

    const paymentMethod = document.getElementById("paymentMethod");
    if (paymentMethod && paymentMethod.value !== "Razorpay") {
        alert("Please select Online Payment.");
        return;
    }

    if (!total || total <= 0) {
        alert("Invalid order amount.");
        return;
    }

    try {
        razorpayBtn.disabled = true;
        razorpayBtn.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Creating Payment...
        `;

        const response = await fetch("/create-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: total })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || "Payment order creation failed");
        }

        const options = {
            key: typeof RAZORPAY_KEY_ID !== "undefined" ? RAZORPAY_KEY_ID : "",
            amount: data.order.amount,
            currency: "INR",
            name: "AR Food",
            description: "Food Order Payment",
            order_id: data.order.id,
            prefill: {
                name: document.querySelector('input[name="name"]')?.value || "",
                contact: document.querySelector('input[name="phone"]')?.value || ""
            },
            theme: { color: "#198754" },
            handler: async function (paymentResponse) {
                try {
                    const verifyResponse = await fetch("/verify-payment", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(paymentResponse)
                    });

                    const verifyResult = await verifyResponse.json();

                    if (!verifyResult.success) {
                        alert("Payment verification failed.");
                        resetRazorpayButton();
                        return;
                    }

                    await placeOrder(paymentResponse);
                } catch (error) {
                    console.error("Verification Error:", error);
                    alert("Payment verification failed. Please contact support.");
                    resetRazorpayButton();
                }
            }
        };

        const razorpay = new Razorpay(options);

        razorpay.on("payment.failed", function (response) {
            console.error("Payment Failed:", response.error);
            alert("Payment failed. Please try again.");
            resetRazorpayButton();
        });

        razorpay.open();

    } catch (error) {
        console.error("Razorpay Error:", error);
        alert(error.message || "Unable to start payment.");
        resetRazorpayButton();
    }
}

// =====================================================
// PLACE ORDER FUNCTION
// =====================================================
async function placeOrder(paymentResponse = null) {
    if (order.length === 0) {
        alert("Your bag is empty!");
        return;
    }

    const orderButton = orderForm ? orderForm.querySelector(".order-btn") : null;
    let originalButton = "";

    if (orderButton) {
        originalButton = orderButton.innerHTML;
        orderButton.disabled = true;
        orderButton.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Please Wait...`;
    }

    try {
        const formData = new FormData(orderForm);

        if (paymentResponse) {
            formData.append("razorpayOrderId", paymentResponse.razorpay_order_id);
            formData.append("razorpayPaymentId", paymentResponse.razorpay_payment_id);
            formData.append("razorpaySignature", paymentResponse.razorpay_signature);
        }

        const response = await fetch("/place-order", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            alert("Order Placed Successfully! ✅\n\nYour order has been received.");
            localStorage.removeItem("order");

            // Send notification email in background
            fetch("https://api.web3forms.com/submit", {
                method: "POST",
                body: formData
            }).catch(err => console.log("Email error:", err));

            window.location.href = "/my-orders";
        } else {
            alert(result.error || result.message || "Order could not be placed.");
            if (orderButton) {
                orderButton.disabled = false;
                orderButton.innerHTML = originalButton;
            }
        }
    } catch (error) {
        console.error("Order placement error:", error);
        alert("Something went wrong. Please try again.");
        if (orderButton) {
            orderButton.disabled = false;
            orderButton.innerHTML = originalButton;
        }
    }
}

// =====================================================
// FORM SUBMIT LISTENER
// =====================================================
if (orderForm) {
    orderForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        if (order.length === 0) {
            alert("Your bag is empty!");
            return;
        }

        const paymentMethod = document.getElementById("paymentMethod");
        const methodValue = paymentMethod ? paymentMethod.value : "";

        if (methodValue === "Cash on Delivery" || methodValue === "UPI / Direct Pay") {
            await placeOrder();
            return;
        }

        if (methodValue === "Razorpay") {
            await startRazorpayPayment();
            return;
        }

        alert("Please select a payment method.");
    });
}