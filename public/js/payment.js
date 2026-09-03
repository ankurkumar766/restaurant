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


let total = 0;


// =====================================================
// EMPTY CART
// =====================================================

if (order.length === 0) {

    container.innerHTML =
        "<p>Your bag is empty.</p>";

}


// =====================================================
// SHOW ORDER
// =====================================================

else {

    order.forEach(item => {

        const subtotal =
            Number(item.price) *
            Number(item.quantity);


        total += subtotal;


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

    });

}


// =====================================================
// SET TOTAL
// =====================================================

grandTotal.innerHTML = total;

hiddenTotal.value = total;

hiddenOrder.value =
    JSON.stringify(order);


// Razorpay amount

if (razorpayAmount) {

    razorpayAmount.innerText =
        total;

}


// =====================================================
// PAYMENT METHOD
// =====================================================

const paymentMethod =
    document.getElementById(
        "paymentMethod"
    );


const orderForm =
    document.getElementById(
        "orderForm"
    );


const orderButton =
    orderForm.querySelector(
        ".order-btn"
    );


// =====================================================
// RAZORPAY BUTTON
// =====================================================

const razorpayBtn =
    document.getElementById(
        "razorpayBtn"
    );


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

    // Empty cart

    if (order.length === 0) {

        alert(
            "Your bag is empty!"
        );

        return;
    }


    // Check payment method

    if (
        paymentMethod.value !==
        "Razorpay"
    ) {

        alert(
            "Please select Online Payment."
        );

        return;
    }


    if (!total || total <= 0) {

        alert(
            "Invalid order amount."
        );

        return;
    }


    try {

        // Button loading

        razorpayBtn.disabled = true;

        razorpayBtn.innerHTML =
            `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Creating Payment...
            `;


        // =================================================
        // CREATE RAZORPAY ORDER
        // =================================================

        const response =
            await fetch(
                "/create-payment",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        amount: total
                    })
                }
            );


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                data.message ||
                "Payment order creation failed"
            );

        }


        // =================================================
        // RAZORPAY OPTIONS
        // =================================================

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


            // =================================================
            // PAYMENT SUCCESS
            // =================================================

            handler:
                async function (
                    paymentResponse
                ) {

                    try {

                        // ============================
                        // VERIFY PAYMENT
                        // ============================

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


                        if (
                            !verifyResult.success
                        ) {

                            alert(
                                "Payment verification failed."
                            );

                            resetRazorpayButton();

                            return;
                        }


                        // ============================
                        // PAYMENT VERIFIED
                        // ============================

                        console.log(
                            "Payment verified:",
                            paymentResponse
                        );


                        // ============================
                        // NOW PLACE ACTUAL ORDER
                        // ============================

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


        // =================================================
        // OPEN RAZORPAY
        // =================================================

        const razorpay =
            new Razorpay(options);


        // =================================================
        // PAYMENT FAILED
        // =================================================

        razorpay.on(
            "payment.failed",
            function (response) {

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


        // Open

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
// PLACE ORDER AFTER PAYMENT
// =====================================================

async function placeOrder(
    paymentResponse = null
) {

    // Empty cart check

    if (order.length === 0) {

        alert(
            "Your bag is empty!"
        );

        return;
    }


    // Save original button

    const originalButton =
        orderButton.innerHTML;


    // Loading

    orderButton.disabled = true;

    orderButton.innerHTML =
        `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Please Wait...
        `;


    try {

        // Form Data

        const formData =
            new FormData(
                orderForm
            );


        // =================================================
        // ADD RAZORPAY DETAILS
        // =================================================

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


        // =================================================
        // PLACE ORDER
        // =================================================

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


        // =================================================
        // SUCCESS
        // =================================================

        if (result.success) {

            alert(
                "Order Placed Successfully! ✅\n\n" +
                "Your order has been received."
            );


            // Clear cart

            localStorage.removeItem(
                "order"
            );


            // =================================================
            // EMAIL
            // =================================================

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


            // =================================================
            // REDIRECT
            // =================================================

            window.location.href =
                "/my-orders";


        } else {

            alert(
                result.error ||
                result.message ||
                "Order could not be placed."
            );


            orderButton.disabled =
                false;


            orderButton.innerHTML =
                originalButton;

        }


    } catch (error) {

        console.error(
            "Order placement error:",
            error
        );


        alert(
            "Something went wrong. Please try again."
        );


        orderButton.disabled =
            false;


        orderButton.innerHTML =
            originalButton;

    }

}


// =====================================================
// FORM SUBMIT
// =====================================================

orderForm.addEventListener(
    "submit",
    async function (e) {

        e.preventDefault();


        // Empty cart

        if (order.length === 0) {

            alert(
                "Your bag is empty!"
            );

            return;
        }


        // ==============================================
        // COD
        // ==============================================

        if (
            paymentMethod.value ===
            "Cash on Delivery"
        ) {

            await placeOrder();

            return;

        }


        // ==============================================
        // RAZORPAY
        // ==============================================

        if (
            paymentMethod.value ===
            "Razorpay"
        ) {

            await startRazorpayPayment();

            return;

        }


        // ==============================================
        // NO PAYMENT METHOD
        // ==============================================

        alert(
            "Please select a payment method."
        );

    }
);


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
        Pay ₹<span id="razorpayAmount">${total}</span>
        `;

}