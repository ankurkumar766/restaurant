// =====================================================
// LOAD ORDER FROM LOCAL STORAGE
// =====================================================

const order =
    JSON.parse(localStorage.getItem("order")) || [];

const container =
    document.getElementById("order-summary");

const hiddenOrder =
    document.getElementById("orderData");

const hiddenTotal =
    document.getElementById("totalAmount");

const grandTotal =
    document.getElementById("grandTotal");

const razorpayAmount =
    document.getElementById("razorpayAmount");

const paymentMethod =
    document.getElementById("paymentMethod");

const orderForm =
    document.getElementById("orderForm");

let total = 0;


// =====================================================
// EMPTY CART / SHOW ORDER
// =====================================================

if (order.length === 0) {

    if (container) {
        container.innerHTML =
            "<p>Your bag is empty.</p>";
    }

} else {

    order.forEach(item => {

        const subtotal =
            Number(item.price) *
            Number(item.quantity);

        total += subtotal;

        if (container) {

            container.innerHTML += `

                <div class="summary-item">

                    <div class="summary-left">

                        <h4>
                            ${item.title}
                        </h4>

                        <p>
                            <b>Size:</b>
                            ${item.variation}

                            <br>

                            <b>Price:</b>
                            ₹${item.price}
                        </p>

                    </div>

                    <div class="summary-right">
                        Qty : ${item.quantity}
                    </div>

                </div>

            `;
        }

    });

}


// =====================================================
// SET TOTAL
// =====================================================

if (grandTotal) {
    grandTotal.innerHTML = total;
}

if (hiddenTotal) {
    hiddenTotal.value = total;
}

if (hiddenOrder) {
    hiddenOrder.value =
        JSON.stringify(order);
}

if (razorpayAmount) {
    razorpayAmount.innerText = total;
}


// =====================================================
// ORDER BUTTON
// =====================================================

const orderButton =
    orderForm?.querySelector(".order-btn");


// =====================================================
// RAZORPAY BUTTON
// =====================================================

const razorpayBtn =
    document.getElementById("razorpayBtn");


// =====================================================
// COPY UPI ID
// =====================================================

function copyUPI() {

    const upiId =
        "7667880272-2@ybl";

    navigator.clipboard
        .writeText(upiId)

        .then(() => {

            const button =
                document.querySelector(".copy-upi");

            if (!button) {
                return;
            }

            const original =
                button.innerHTML;

            button.innerHTML =
                '<i class="fa-solid fa-check"></i>';

            setTimeout(() => {

                button.innerHTML =
                    original;

            }, 1500);

        })

        .catch(() => {

            alert(
                "UPI ID: " + upiId
            );

        });

}


// =====================================================
// OPEN PHONEPE / UPI
// =====================================================

function openPhonePe() {

    // ==============================================
    // EMPTY CART CHECK
    // ==============================================

    if (order.length === 0) {

        alert(
            "Your bag is empty!"
        );

        return;
    }


    // ==============================================
    // CHECK AMOUNT
    // ==============================================

    if (!total || Number(total) <= 0) {

        alert(
            "Please add items to your order first."
        );

        return;
    }


    // ==============================================
    // CHECK PAYMENT METHOD
    // ==============================================

    if (
        paymentMethod &&
        paymentMethod.value !== "PhonePe"
    ) {

        alert(
            "Please select PhonePe / UPI."
        );

        return;
    }


    // ==============================================
    // UPI DETAILS
    // ==============================================

    const upiId =
        "7667880272-2@ybl";

    const merchantName =
        "Ankur Kumar";


    // ==============================================
    // CREATE UPI URL
    // ==============================================

    const upiLink =
        "upi://pay" +
        "?pa=" + encodeURIComponent(upiId) +
        "&pn=" + encodeURIComponent(merchantName) +
        "&am=" + encodeURIComponent(
            Number(total).toFixed(2)
        ) +
        "&cu=INR";


    console.log(
        "Opening UPI:",
        upiLink
    );


    // ==============================================
    // OPEN UPI APP
    // ==============================================

    window.location.assign(
        upiLink
    );

}


// =====================================================
// OPEN WHATSAPP
// =====================================================

function openWhatsApp() {

    if (order.length === 0) {

        alert(
            "Your bag is empty!"
        );

        return;
    }


    const amount =
        Number(total).toFixed(2);


    const message =
        `Hello, I am sending payment screenshot.%0A%0ATotal Amount: ₹${amount}`;


    window.location.href =
        `https://wa.me/917667880272?text=${message}`;

}


// =====================================================
// RAZORPAY BUTTON CLICK
// =====================================================

if (razorpayBtn) {

    razorpayBtn.addEventListener(
        "click",
        startRazorpayPayment
    );

}


// =====================================================
// START RAZORPAY PAYMENT
// =====================================================

async function startRazorpayPayment() {

    // ==============================================
    // EMPTY CART
    // ==============================================

    if (order.length === 0) {

        alert(
            "Your bag is empty!"
        );

        return;
    }


    // ==============================================
    // CHECK PAYMENT METHOD
    // ==============================================

    if (
        paymentMethod &&
        paymentMethod.value !== "Razorpay"
    ) {

        alert(
            "Please select Razorpay."
        );

        return;
    }


    // ==============================================
    // CHECK AMOUNT
    // ==============================================

    if (!total || total <= 0) {

        alert(
            "Invalid order amount."
        );

        return;
    }


    // ==============================================
    // CHECK RAZORPAY LIBRARY
    // ==============================================

    if (typeof Razorpay === "undefined") {

        alert(
            "Razorpay payment system is not loaded."
        );

        return;
    }


    try {

        // ==========================================
        // BUTTON LOADING
        // ==========================================

        if (razorpayBtn) {

            razorpayBtn.disabled =
                true;

            razorpayBtn.innerHTML =
                `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Creating Payment...
                `;

        }


        // ==========================================
        // CREATE RAZORPAY ORDER
        // ==========================================

        const response =
            await fetch(
                "/create-payment",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            amount: total
                        })
                }
            );


        const data =
            await response.json();


        console.log(
            "Create Payment Response:",
            data
        );


        if (!data.success) {

            throw new Error(
                data.message ||
                "Payment order creation failed."
            );

        }


        // ==========================================
        // RAZORPAY OPTIONS
        // ==========================================

        const options = {

            key:
                RAZORPAY_KEY_ID,

            amount:
                data.order.amount,

            currency:
                "INR",

            name:
                "AR Food",

            description:
                "Food Order Payment",

            order_id:
                data.order.id,

            prefill: {

                name:
                    document.querySelector(
                        'input[name="name"]'
                    )?.value || "",

                contact:
                    document.querySelector(
                        'input[name="phone"]'
                    )?.value || ""

            },

            theme: {

                color:
                    "#198754"

            },


            // ======================================
            // PAYMENT SUCCESS
            // ======================================

            handler:
                async function(paymentResponse) {

                    try {

                        console.log(
                            "Razorpay Payment:",
                            paymentResponse
                        );


                        // =================================
                        // VERIFY PAYMENT
                        // =================================

                        const verifyResponse =
                            await fetch(
                                "/verify-payment",
                                {
                                    method: "POST",

                                    headers: {
                                        "Content-Type":
                                            "application/json"
                                    },

                                    body:
                                        JSON.stringify(
                                            paymentResponse
                                        )
                                }
                            );


                        const verifyResult =
                            await verifyResponse.json();


                        console.log(
                            "Verify Payment Response:",
                            verifyResult
                        );


                        if (
                            !verifyResult.success
                        ) {

                            alert(
                                "Payment verification failed."
                            );

                            resetRazorpayButton();

                            return;
                        }


                        // =================================
                        // PAYMENT VERIFIED
                        // =================================

                        await placeOrder(
                            paymentResponse
                        );


                    } catch (error) {

                        console.error(
                            "Verification Error:",
                            error
                        );


                        alert(
                            "Payment verification failed. Please contact support."
                        );


                        resetRazorpayButton();

                    }

                }

        };


        // ==========================================
        // CREATE RAZORPAY INSTANCE
        // ==========================================

        const razorpay =
            new Razorpay(options);


        // ==========================================
        // PAYMENT FAILED
        // ==========================================

        razorpay.on(
            "payment.failed",
            function(response) {

                console.error(
                    "Payment Failed:",
                    response.error
                );


                alert(
                    "Payment failed. Please try again."
                );


                resetRazorpayButton();

            }
        );


        // ==========================================
        // OPEN RAZORPAY
        // ==========================================

        razorpay.open();


    } catch (error) {

        console.error(
            "Razorpay Error:",
            error
        );


        alert(
            error.message ||
            "Unable to start payment."
        );


        resetRazorpayButton();

    }

}


// =====================================================
// PLACE ORDER
// =====================================================

async function placeOrder(
    paymentResponse = null
) {

    // ==============================================
    // EMPTY CART
    // ==============================================

    if (order.length === 0) {

        alert(
            "Your bag is empty!"
        );

        return;
    }


    // ==============================================
    // SAVE ORIGINAL BUTTON
    // ==============================================

    const originalButton =
        orderButton
            ? orderButton.innerHTML
            : "";


    // ==============================================
    // LOADING
    // ==============================================

    if (orderButton) {

        orderButton.disabled =
            true;

        orderButton.innerHTML =
            `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Please Wait...
            `;

    }


    try {

        // ==========================================
        // FORM DATA
        // ==========================================

        const formData =
            new FormData(
                orderForm
            );


        // ==========================================
        // ADD RAZORPAY DETAILS
        // ==========================================

        if (paymentResponse) {

            formData.append(
                "razorpayOrderId",
                paymentResponse.razorpay_order_id
            );

            formData.append(
                "razorpayPaymentId",
                paymentResponse.razorpay_payment_id
            );

            formData.append(
                "razorpaySignature",
                paymentResponse.razorpay_signature
            );

        }


        // ==========================================
        // PLACE ORDER
        // ==========================================

        const response =
            await fetch(
                "/place-order",
                {
                    method: "POST",
                    body: formData
                }
            );


        const result =
            await response.json();


        console.log(
            "Place Order Response:",
            result
        );


        // ==========================================
        // SUCCESS
        // ==========================================

        if (result.success) {

            alert(
                "Order Placed Successfully! ✅\n\n" +
                "Your order has been received."
            );


            // ======================================
            // CLEAR CART
            // ======================================

            localStorage.removeItem(
                "order"
            );


            // ======================================
            // SEND EMAIL
            // ======================================

            fetch(
                "https://api.web3forms.com/submit",
                {
                    method: "POST",
                    body: formData
                }
            )
                .then(() => {

                    console.log(
                        "Order email sent successfully"
                    );

                })
                .catch((err) => {

                    console.log(
                        "Email sending error:",
                        err
                    );

                });


            // ======================================
            // REDIRECT
            // ======================================

            window.location.href =
                "/my-orders";

        } else {

            alert(
                result.error ||
                result.message ||
                "Order could not be placed."
            );


            if (orderButton) {

                orderButton.disabled =
                    false;

                orderButton.innerHTML =
                    originalButton;

            }

        }


    } catch (error) {

        console.error(
            "Order placement error:",
            error
        );


        alert(
            "Something went wrong. Please try again."
        );


        if (orderButton) {

            orderButton.disabled =
                false;

            orderButton.innerHTML =
                originalButton;

        }

    }

}


// =====================================================
// FORM SUBMIT
// =====================================================

if (orderForm) {

    orderForm.addEventListener(
        "submit",
        async function(e) {

            e.preventDefault();


            // ==========================================
            // EMPTY CART
            // ==========================================

            if (order.length === 0) {

                alert(
                    "Your bag is empty!"
                );

                return;
            }


            // ==========================================
            // PAYMENT METHOD
            // ==========================================

            const selectedMethod =
                paymentMethod
                    ? paymentMethod.value
                    : "";


            // ==========================================
            // COD
            // ==========================================

            if (
                selectedMethod ===
                "Cash on Delivery"
            ) {

                await placeOrder();

                return;

            }


            // ==========================================
            // RAZORPAY
            // ==========================================

            if (
                selectedMethod ===
                "Razorpay"
            ) {

                await startRazorpayPayment();

                return;

            }


            // ==========================================
            // PHONEPE / UPI
            // ==========================================

            if (
                selectedMethod ===
                "PhonePe"
            ) {

                openPhonePe();

                return;

            }


            // ==========================================
            // NO PAYMENT METHOD
            // ==========================================

            alert(
                "Please select a payment method."
            );

        }
    );

}


// =====================================================
// RESET RAZORPAY BUTTON
// =====================================================

function resetRazorpayButton() {

    if (!razorpayBtn) {
        return;
    }


    razorpayBtn.disabled =
        false;


    razorpayBtn.innerHTML =
        `
        <i class="fa-solid fa-lock"></i>
        Pay ₹<span id="razorpayAmount">
            ${total}
        </span>
        `;

}
