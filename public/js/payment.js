
document.addEventListener(
    "DOMContentLoaded",
    function () {

        // =====================================================
        // ELEMENTS
        // =====================================================

        const order =
            JSON.parse(
                localStorage.getItem("order")
            ) || [];

        const container =
            document.getElementById(
                "order-summary"
            );

        const form =
            document.getElementById(
                "orderForm"
            );

        const paymentMethod =
            document.getElementById(
                "paymentMethod"
            );

        const paymentMethodHidden =
            document.getElementById(
                "paymentMethodHidden"
            );

        const hiddenOrder =
            document.getElementById(
                "orderData"
            );

        const hiddenTotal =
            document.getElementById(
                "totalAmount"
            );

        const grandTotal =
            document.getElementById(
                "grandTotal"
            );

        const orderButton =
            document.getElementById(
                "orderButton"
            );

        const upiPaymentStatus =
            document.getElementById(
                "upiPaymentStatus"
            );

        const cashfreeOrderId =
            document.getElementById(
                "cashfreeOrderId"
            );


        // =====================================================
        // CHECK FORM
        // =====================================================

        if (!form) {

            console.error(
                "Payment form not found."
            );

            return;
        }


        // =====================================================
        // CALCULATE TOTAL
        // =====================================================

        let total = 0;

        // FIXED DELIVERY CHARGE
        const deliveryCharge = 30;


        // =====================================================
        // CLEAR SUMMARY
        // =====================================================

        if (container) {

            container.innerHTML = "";

        }


        // =====================================================
        // SHOW ORDER ITEMS
        // =====================================================

        order.forEach(
            function (item) {

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
                                    ${item.title || item.name || "Food Item"}
                                </h4>

                                <p>

                                    ${
                                        item.variation
                                            ? `<b>Size:</b> ${item.variation}<br>`
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

            }
        );


        // =====================================================
        // FINAL TOTAL = FOOD TOTAL + DELIVERY
        // =====================================================

        const finalTotal =
            total + deliveryCharge;


        // =====================================================
        // SET TOTAL
        // =====================================================

        if (grandTotal) {

            grandTotal.textContent =
                finalTotal.toFixed(2);

        }


        if (hiddenTotal) {

            hiddenTotal.value =
                finalTotal.toFixed(2);

        }


        if (hiddenOrder) {

            hiddenOrder.value =
                JSON.stringify(order);

        }


        // =====================================================
        // PAYMENT METHOD CHANGE
        // =====================================================

        paymentMethod.addEventListener(
            "change",
            function () {

                if (
                    paymentMethod.value ===
                    "UPI"
                ) {

                    upiPaymentStatus.style.display =
                        "flex";

                } else {

                    upiPaymentStatus.style.display =
                        "none";

                }

            }
        );


        // =====================================================
        // FORM SUBMIT
        // =====================================================

        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const selectedMethod =
                    paymentMethod.value;


                // =================================================
                // PAYMENT METHOD CHECK
                // =================================================

                if (!selectedMethod) {

                    alert(
                        "Please select a payment method."
                    );

                    return;
                }


                // =================================================
                // ORDER CHECK
                // =================================================

                if (order.length === 0) {

                    alert(
                        "Your bag is empty."
                    );

                    return;
                }


                // =================================================
                // AMOUNT CHECK
                // =================================================

                if (finalTotal < 1) {

                    alert(
                        "Minimum payment amount is ₹1."
                    );

                    return;
                }


                // =================================================
                // COD
                // =================================================

                if (
                    selectedMethod ===
                    "Cash on Delivery"
                ) {

                    await placeOrder(
                        "Cash on Delivery"
                    );

                    return;
                }


                // =================================================
                // CASHFREE
                // =================================================

                if (
                    selectedMethod ===
                    "UPI"
                ) {

                    await startCashfreePayment();

                    return;
                }

            }
        );


        // =====================================================
        // CASHFREE PAYMENT
        // =====================================================

        async function startCashfreePayment() {

            const originalButtonHTML =
                orderButton.innerHTML;


            try {

                // =================================================
                // BUTTON LOADING
                // =================================================

                orderButton.disabled =
                    true;
                orderButton.innerHTML = `

                    <i class="fa-solid fa-spinner fa-spin"></i>

                    Creating Secure Payment...

                `;


                // =================================================
                // CREATE CASHFREE ORDER
                // =================================================

                const response =
                    await fetch(
                        "/payment/create-order",
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body: JSON.stringify({

                                // FOOD TOTAL + ₹30 DELIVERY
                                amount:
                                    finalTotal,

                                name:
                                    form.elements.name?.value || "",

                                email:
                                    form.elements.email?.value || "",

                                phone:
                                    form.elements.phone?.value || ""

                            })

                        }
                    );


                const data =
                    await response.json();


                console.log(
                    "Cashfree Create Order:",
                    data
                );


                if (
                    !response.ok ||
                    !data.success
                ) {

                    throw new Error(
                        data.message ||
                        "Unable to create Cashfree payment."
                    );

                }


                // =================================================
                // SAVE CASHFREE ORDER ID
                // =================================================

                if (cashfreeOrderId) {

                    cashfreeOrderId.value =
                        data.order_id;

                }


                // =================================================
                // INITIALIZE CASHFREE
                // =================================================

                const cashfree =
                    Cashfree({

                        mode:
                            data.mode ||
                            "sandbox"

                    });


                // =================================================
                // CHECK PAYMENT SESSION
                // =================================================

                if (
                    !data.payment_session_id
                ) {

                    throw new Error(
                        "Cashfree payment session was not received."
                    );

                }


                // =================================================
                // OPEN CASHFREE CHECKOUT
                // =================================================

                const checkoutOptions = {

                    paymentSessionId:
                        data.payment_session_id,

                    redirectTarget:
                        "_self"

                };


                await cashfree.checkout(
                    checkoutOptions
                );


            } catch (error) {

                console.error(
                    "Cashfree Payment Error:",
                    error
                );


                alert(
                    error.message ||
                    "Unable to start online payment."
                );


                orderButton.disabled =
                    false;

                orderButton.innerHTML =
                    originalButtonHTML;

            }

        }


        // =====================================================
        // PLACE ORDER
        // =====================================================

        async function placeOrder(
            selectedPaymentMethod
        ) {

            const originalButtonHTML =
                orderButton.innerHTML;


            try {

                // =================================================
                // LOADING
                // =================================================

                orderButton.disabled =
                    true;

                orderButton.innerHTML = `

                    <i class="fa-solid fa-spinner fa-spin"></i>

                    Placing Order...

                `;


                // =================================================
                // UPDATE HIDDEN DATA
                // =================================================

                if (hiddenOrder) {

                    hiddenOrder.value =
                        JSON.stringify(order);

                }


                if (hiddenTotal) {

                    // FOOD TOTAL + ₹30 DELIVERY
                    hiddenTotal.value =
                        finalTotal.toFixed(2);

                }


                if (paymentMethodHidden) {

                    paymentMethodHidden.value =
                        selectedPaymentMethod;

                }


                // =================================================
                // FORM DATA
                // =================================================

                const formData =
                    new FormData(form);


                formData.set(
                    "orderData",
                    JSON.stringify(order)
                );


                // FOOD TOTAL + ₹30 DELIVERY
                formData.set(
                    "total",
                    finalTotal.toFixed(2)
                );


                formData.set(
                    "paymentMethod",
                    selectedPaymentMethod
                );


                // =================================================
                // CASHFREE ORDER ID
                // =================================================

                if (
                    cashfreeOrderId &&
                    cashfreeOrderId.value
                ) {

                    formData.set(
                        "cashfreeOrderId",
                        cashfreeOrderId.value
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


                // =================================================
                // RESPONSE TYPE
                // =================================================

                const contentType =
                    response.headers.get(
                        "content-type"
                    ) || "";


                // =================================================
                // JSON RESPONSE
                // =================================================

                if (
                    contentType.includes(
                        "application/json"
                    )
                ) {

                    const data =
                        await response.json();


                    console.log(
                        "Place Order Response:",
                        data
                    );


                    if (
                        !response.ok ||
                        data.success === false
                    ) {

                        throw new Error(
                            data.message ||
                            data.error ||
                            "Order placement failed."
                        );

                    }


                    // =============================================
                    // CLEAR ORDER
                    // =============================================

                    localStorage.removeItem(
                        "order"
                    );


                    localStorage.removeItem(
                        "cart"
                    );


                    // =============================================
                    // REDIRECT
                    // =============================================

                    window.location.href =
                        data.redirect ||
                        "/my-orders";


                    return;

                }


                // =================================================
                // EXPRESS REDIRECT
                // =================================================

                if (
                    response.redirected
                ) {

                    localStorage.removeItem(
                        "order"
                    );


                    localStorage.removeItem(
                        "cart"
                    );


                    window.location.href =
                        response.url;


                    return;

                }


                // =================================================
                // HTML RESPONSE
                // =================================================

                const html =
                    await response.text();


                localStorage.removeItem(
                    "order"
                );


                localStorage.removeItem(
                    "cart"
                );


                document.open();

                document.write(html);

                document.close();


            } catch (error) {

                console.error(
                    "Place Order Error:",
                    error
                );


                alert(
                    error.message ||
                    "Unable to place order."
                );


                orderButton.disabled =
                    false;

                orderButton.innerHTML =
                    originalButtonHTML;

            }

        }


        // =====================================================
        // CASHFREE RETURN HANDLING
        // =====================================================
        //
        // Cashfree redirects to:
        //
        // /payment/cashfree-return?order_id=XXXX
        //
        // The backend verifies the payment and then redirects
        // back to this payment page with ?payment=success
        //
        // =====================================================

        const urlParams =
            new URLSearchParams(
                window.location.search
            );


        const paymentStatus =
            urlParams.get(
                "payment"
            );


        const returnedOrderId =
            urlParams.get(
                "order_id"
            );


        if (
            paymentStatus ===
            "success"
        ) {

            if (returnedOrderId) {

                if (cashfreeOrderId) {

                    cashfreeOrderId.value =
                        returnedOrderId;

                }


                verifyReturnedPayment(
                    returnedOrderId
                );

            }

        }


        // =====================================================
        // VERIFY RETURNED PAYMENT
        // =====================================================

        async function verifyReturnedPayment(
            orderId
        ) {

            try {

                orderButton.disabled =
                    true;


                orderButton.innerHTML = `

                    <i class="fa-solid fa-spinner fa-spin"></i>

                    Verifying Payment...

                `;


                const response =
                    await fetch(
                        "/payment/verify",
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body: JSON.stringify({

                                order_id:
                                    orderId

                            })

                        }
                    );


                const data =
                    await response.json();


                console.log(
                    "Cashfree Verify:",
                    data
                );


                if (
                    !response.ok ||
                    !data.success
                ) {

                    throw new Error(
                        data.message ||
                        "Payment verification failed."
                    );

                }


                // =================================================
                // PAYMENT SUCCESS
                // =================================================

                if (
                    data.payment_status ===
                    "SUCCESS"
                ) {

                    alert(
                        "Payment successful! ✅"
                    );


                    await placeOrder(
                        "UPI"
                    );


                    return;

                }


                // =================================================
                // PAYMENT NOT SUCCESS
                // =================================================

                throw new Error(
                    "Payment was not successful. Order was not placed."
                );


            } catch (error) {

                console.error(
                    "Cashfree Verification Error:",
                    error
                );


                alert(
                    error.message ||
                    "Payment verification failed. Order was not placed."
                );


                orderButton.disabled =
                    false;


                orderButton.innerHTML = `

                    <span>

                        <i class="fa-solid fa-bag-shopping"></i>

                        Place Order

                    </span>

                    <i class="fa-solid fa-arrow-right"></i>

                `;

            }

        }

    }
);

