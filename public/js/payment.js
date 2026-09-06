// ==========================================================
// PAYMENT.JS
// AR FOOD - RAZORPAY UPI + COD
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================================
    // ELEMENTS
    // ==========================================================

    const order =
        JSON.parse(
            localStorage.getItem("order")
        ) || [];

    const container =
        document.getElementById("order-summary");

    const hiddenOrder =
        document.getElementById("orderData");

    const hiddenTotal =
        document.getElementById("totalAmount");

    const grandTotal =
        document.getElementById("grandTotal");

    const paymentMethod =
        document.getElementById("paymentMethod");

    const form =
        document.getElementById("orderForm");

    const orderButton =
        form.querySelector(".order-btn");


    // ==========================================================
    // CALCULATE TOTAL
    // ==========================================================

    let total = 0;


    // ==========================================================
    // SHOW ORDER ITEMS
    // ==========================================================

    if (container) {

        container.innerHTML = "";

    }


    order.forEach(item => {

        const price =
            Number(item.price) || 0;

        const quantity =
            Number(item.quantity) || 1;

        const subtotal =
            price * quantity;

        total += subtotal;


        if (container) {

            container.innerHTML += `

                <div class="summary-item">

                    <div class="summary-left">

                        <h4>
                            ${
                                item.title ||
                                item.name ||
                                "Food Item"
                            }
                        </h4>

                        <p>

                            ${
                                item.variation
                                    ? `
                                        <b>Size:</b>
                                        ${item.variation}
                                        <br>
                                      `
                                    : ""
                            }

                            <b>Price:</b>
                            ₹${price.toFixed(2)}

                        </p>

                    </div>


                    <div class="summary-right">

                        Qty : ${quantity}

                    </div>

                </div>

            `;

        }

    });


    // ==========================================================
    // SET TOTAL
    // ==========================================================

    if (grandTotal) {

        grandTotal.textContent =
            total.toFixed(2);

    }


    if (hiddenTotal) {

        hiddenTotal.value =
            total.toFixed(2);

    }


    if (hiddenOrder) {

        hiddenOrder.value =
            JSON.stringify(order);

    }


    // ==========================================================
    // FORM SUBMIT
    // ==========================================================

    form.addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();


            // ==================================================
            // PAYMENT METHOD
            // ==================================================

            const selectedMethod =
                paymentMethod.value;


            if (!selectedMethod) {

                alert(
                    "Please select a payment method."
                );

                return;

            }


            // ==================================================
            // TOTAL CHECK
            // ==================================================

            if (total < 1) {

                alert(
                    "Minimum order amount is ₹1."
                );

                return;

            }


            // ==================================================
            // COD
            // ==================================================

            if (
                selectedMethod ===
                "Cash on Delivery"
            ) {

                await placeOrder(
                    "Cash on Delivery"
                );

                return;

            }


            // ==================================================
            // ONLINE / UPI / RAZORPAY
            // ==================================================

            if (
                selectedMethod === "UPI" ||
                selectedMethod === "Razorpay" ||
                selectedMethod === "PhonePe"
            ) {

                await startRazorpayPayment();

                return;

            }


            alert(
                "Invalid payment method."
            );

        }
    );


    // ==========================================================
    // START RAZORPAY PAYMENT
    // ==========================================================

    async function startRazorpayPayment() {

        const originalButton =
            orderButton.innerHTML;


        try {

            // ==================================================
            // BUTTON LOADING
            // ==================================================

            orderButton.disabled = true;

            orderButton.innerHTML = `

                <i class="fa-solid fa-spinner fa-spin"></i>

                Opening Payment...

            `;


            // ==================================================
            // CREATE RAZORPAY ORDER
            // ==================================================

            const createResponse =
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


            const createData =
                await createResponse.json();


            console.log(
                "Create Razorpay Order:",
                createData
            );


            if (
                !createResponse.ok ||
                !createData.success
            ) {

                throw new Error(
                    createData.message ||
                    "Unable to create Razorpay order."
                );

            }


            // ==================================================
            // RAZORPAY OPTIONS
            // ==================================================

            const options = {

                key: RAZORPAY_KEY_ID,

                amount:
                    createData.order
                        ? createData.order.amount
                        : createData.amount,

                currency:
                    createData.order
                        ? createData.order.currency
                        : createData.currency,

                name:
                    "AR Food",

                description:
                    "AR Food Order Payment",

                order_id:
                    createData.order
                        ? createData.order.id
                        : createData.order_id,


                // ==================================================
                // CUSTOMER DETAILS
                // ==================================================

                prefill: {

                    name:
                        form.elements.name?.value ||
                        "",

                    contact:
                        form.elements.phone?.value ||
                        ""

                },


                // ==================================================
                // THEME
                // ==================================================

                theme: {

                    color:
                        "#ff6b35"

                },


                // ==================================================
                // PAYMENT SUCCESS
                // ==================================================

                handler:
                    async function (response) {

                        console.log(
                            "Razorpay Success:",
                            response
                        );


                        try {

                            // ==========================================
                            // VERIFY PAYMENT
                            // ==========================================

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
                                            JSON.stringify({

                                                razorpay_order_id:
                                                    response
                                                        .razorpay_order_id,

                                                razorpay_payment_id:
                                                    response
                                                        .razorpay_payment_id,

                                                razorpay_signature:
                                                    response
                                                        .razorpay_signature

                                            })

                                    }
                                );


                            const verifyData =
                                await verifyResponse.json();


                            console.log(
                                "Razorpay Verify Response:",
                                verifyData
                            );


                            // ==========================================
                            // VERIFICATION FAILED
                            // ==========================================

                            if (
                                !verifyResponse.ok ||
                                !verifyData.success
                            ) {

                                alert(
                                    "Payment verification failed.\n\n" +
                                    "Your order has NOT been placed."
                                );


                                orderButton.disabled =
                                    false;


                                orderButton.innerHTML =
                                    originalButton;


                                return;

                            }


                            // ==========================================
                            // PAYMENT VERIFIED
                            // ==========================================

                            console.log(
                                "Payment verified successfully."
                            );


                            // ==========================================
                            // SAVE RAZORPAY DETAILS
                            // ==========================================

                            const razorpayOrderId =
                                document.getElementById(
                                    "razorpayOrderId"
                                );


                            const razorpayPaymentId =
                                document.getElementById(
                                    "razorpayPaymentId"
                                );


                            const razorpaySignature =
                                document.getElementById(
                                    "razorpaySignature"
                                );


                            if (razorpayOrderId) {

                                razorpayOrderId.value =
                                    response
                                        .razorpay_order_id;

                            }


                            if (razorpayPaymentId) {

                                razorpayPaymentId.value =
                                    response
                                        .razorpay_payment_id;

                            }


                            if (razorpaySignature) {

                                razorpaySignature.value =
                                    response
                                        .razorpay_signature;

                            }


                            // ==========================================
                            // NOW PLACE ORDER
                            // ==========================================

                            await placeOrder(
                                "UPI"
                            );

                        }


                        catch (error) {

                            console.error(
                                "Verification Error:",
                                error
                            );


                            alert(
                                "Payment verification failed. " +
                                "Order was not placed."
                            );


                            orderButton.disabled =
                                false;


                            orderButton.innerHTML =
                                originalButton;

                        }

                    },


                // ==================================================
                // PAYMENT MODAL CLOSED
                // ==================================================

                modal: {

                    ondismiss:
                        function () {

                            console.log(
                                "Razorpay payment window closed."
                            );


                            orderButton.disabled =
                                false;


                            orderButton.innerHTML =
                                originalButton;

                        }

                }

            };


            // ==================================================
            // OPEN RAZORPAY
            // ==================================================

            const razorpay =
                new Razorpay(options);


            // ==================================================
            // PAYMENT FAILED
            // ==================================================

            razorpay.on(
                "payment.failed",
                function (response) {

                    console.error(
                        "Payment Failed:",
                        response.error
                    );


                    alert(
                        response.error?.description ||
                        "Payment failed. Please try again."
                    );


                    orderButton.disabled =
                        false;


                    orderButton.innerHTML =
                        originalButton;

                }
            );


            // ==================================================
            // OPEN PAYMENT WINDOW
            // ==================================================

            razorpay.open();

        }


        catch (error) {

            console.error(
                "Razorpay Error:",
                error
            );


            alert(
                error.message ||
                "Unable to start Razorpay payment."
            );


            orderButton.disabled =
                false;


            orderButton.innerHTML =
                originalButton;

        }

    }


    // ==========================================================
    // PLACE ORDER
    // ==========================================================

    async function placeOrder(
        selectedPaymentMethod
    ) {

        const originalButton =
            orderButton.innerHTML;


        try {

            // ==================================================
            // LOADING
            // ==================================================

            orderButton.disabled =
                true;


            orderButton.innerHTML = `

                <i class="fa-solid fa-spinner fa-spin"></i>

                Please Wait...

            `;


            // ==================================================
            // UPDATE HIDDEN DATA
            // ==================================================

            hiddenOrder.value =
                JSON.stringify(order);


            hiddenTotal.value =
                total.toFixed(2);


            paymentMethod.value =
                selectedPaymentMethod;


            // ==================================================
            // FORM DATA
            // ==================================================

            const formData =
                new FormData(form);


            formData.set(
                "orderData",
                JSON.stringify(order)
            );


            formData.set(
                "total",
                total.toFixed(2)
            );


            formData.set(
                "paymentMethod",
                selectedPaymentMethod
            );


            // ==================================================
            // PLACE ORDER REQUEST
            // ==================================================

            const response =
                await fetch(
                    "/place-order",
                    {

                        method: "POST",

                        body: formData

                    }
                );


            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";


            // ==================================================
            // JSON RESPONSE
            // ==================================================

            if (
                contentType.includes(
                    "application/json"
                )
            ) {

                const result =
                    await response.json();


                console.log(
                    "Place Order Response:",
                    result
                );


                if (!result.success) {

                    throw new Error(
                        result.error ||
                        result.message ||
                        "Order could not be placed."
                    );

                }


                // ==================================================
                // SUCCESS
                // ==================================================

                alert(
                    "Order Placed Successfully! ✅\n\n" +
                    "Your order has been received."
                );


                // ==================================================
                // CLEAR ORDER
                // ==================================================

                localStorage.removeItem(
                    "order"
                );


                // ==================================================
                // EMAIL
                // ==================================================

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
                    .catch(err => {

                        console.error(
                            "Email error:",
                            err
                        );

                    });


                // ==================================================
                // REDIRECT
                // ==================================================

                window.location.href =
                    "/my-orders";


                return;

            }


            // ==================================================
            // REDIRECT RESPONSE
            // ==================================================

            if (response.redirected) {

                localStorage.removeItem(
                    "order"
                );


                window.location.href =
                    response.url;


                return;

            }


            // ==================================================
            // OTHER RESPONSE
            // ==================================================

            const text =
                await response.text();


            console.log(
                "Server Response:",
                text
            );


            orderButton.disabled =
                false;


            orderButton.innerHTML =
                originalButton;

        }


        catch (error) {

            console.error(
                "Order placement error:",
                error
            );


            alert(
                error.message ||
                "Something went wrong. Please try again."
            );


            orderButton.disabled =
                false;


            orderButton.innerHTML =
                originalButton;

        }

    }

});