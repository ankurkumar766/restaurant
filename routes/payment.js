// ============================================================
// AR FOOD
// CASHFREE PAYMENT ROUTE
// ============================================================


const express =
    require("express");


const router =
    express.Router();


// ============================================================
// CASHFREE CONFIG
// ============================================================

const CASHFREE_APP_ID =
    process.env.CASHFREE_APP_ID;


const CASHFREE_SECRET_KEY =
    process.env.CASHFREE_SECRET_KEY;


// ============================================================
// ENVIRONMENT
// ============================================================
//
// CASHFREE_ENV=sandbox
//
// OR
//
// CASHFREE_ENV=production
//
// ============================================================

const CASHFREE_ENV =
    process.env.CASHFREE_ENV ||
    "sandbox";


const CASHFREE_BASE_URL =
    CASHFREE_ENV === "production"

        ? "https://api.cashfree.com/pg"

        : "https://sandbox.cashfree.com/pg";


const CASHFREE_API_VERSION =
    "2025-01-01";


// ============================================================
// CHECK CONFIGURATION
// ============================================================

if (
    !CASHFREE_APP_ID ||
    !CASHFREE_SECRET_KEY
) {

    console.warn(
        "⚠️ Cashfree API credentials are missing."
    );

}


// ============================================================
// CREATE CASHFREE ORDER
// ============================================================

router.post(
    "/create-order",
    async function (req, res) {


        try {


            // =================================================
            // GET DATA
            // =================================================

            const amount =
                Number(req.body.amount);


            const name =
                String(
                    req.body.name || ""
                ).trim();


            const email =
                String(
                    req.body.email || ""
                ).trim();


            const phone =
                String(
                    req.body.phone || ""
                ).trim();


            // =================================================
            // VALIDATE AMOUNT
            // =================================================

            if (
                !Number.isFinite(amount) ||
                amount < 1
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid payment amount."

                });

            }


            // =================================================
            // VALIDATE CREDENTIALS
            // =================================================

            if (
                !CASHFREE_APP_ID ||
                !CASHFREE_SECRET_KEY
            ) {

                return res.status(500).json({

                    success: false,

                    message:
                        "Cashfree API credentials are not configured."

                });

            }


            // =================================================
            // CUSTOMER ID
            // =================================================

            const customerId =
                req.user?._id
                    ? String(req.user._id)
                    : `guest_${Date.now()}`;


            // =================================================
            // ORDER ID
            // =================================================

            const orderId =
                "ARFOOD_" +
                Date.now() +
                "_" +
                Math.floor(
                    Math.random() * 100000
                );


            // =================================================
            // RETURN URL
            // =================================================

            // const protocol =
            //     req.protocol;


            // const host =
            //     req.get("host");


            const returnUrl =
                `${protocol}://${host}/payment/cashfree-return?order_id=${encodeURIComponent(orderId)}`;


            // =================================================
            // CASHFREE REQUEST
            // =================================================

            const cashfreeRequest = {

                order_id:
                    orderId,

                order_amount:
                    Number(
                        amount.toFixed(2)
                    ),

                order_currency:
                    "INR",

                customer_details: {

                    customer_id:
                        customerId,

                    customer_name:
                        name ||
                        "AR Food Customer",

                    customer_email:
                        email ||
                        "customer@example.com",

                    customer_phone:
                        phone ||
                        "9999999999"

                },

                order_meta: {

                    return_url:
                        returnUrl

                },

                order_note:
                    "AR Food Order Payment"

            };


            // =================================================
            // CALL CASHFREE
            // =================================================

            const cashfreeResponse =
                await fetch(
                    `${CASHFREE_BASE_URL}/orders`,
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json",

                            "x-api-version":
                                CASHFREE_API_VERSION,

                            "x-client-id":
                                CASHFREE_APP_ID,

                            "x-client-secret":
                                CASHFREE_SECRET_KEY

                        },

                        body:
                            JSON.stringify(
                                cashfreeRequest
                            )

                    }
                );


            // =================================================
            // RESPONSE JSON
            // =================================================

            const data =
                await cashfreeResponse.json();


            console.log(
                "Cashfree Create Order:",
                data
            );


            // =================================================
            // CASHFREE ERROR
            // =================================================

            if (
                !cashfreeResponse.ok
            ) {

                return res.status(
                    cashfreeResponse.status
                ).json({

                    success: false,

                    message:
                        data.message ||
                        data.type ||
                        "Cashfree order creation failed.",

                    error:
                        data

                });

            }


            // =================================================
            // SESSION CHECK
            // =================================================

            if (
                !data.payment_session_id
            ) {

                return res.status(500).json({

                    success: false,

                    message:
                        "Cashfree payment session was not received."

                });

            }


            // =================================================
            // SEND TO FRONTEND
            // =================================================

            return res.json({

                success:
                    true,

                order_id:
                    data.order_id,

                payment_session_id:
                    data.payment_session_id,

                amount:
                    data.order_amount,

                currency:
                    data.order_currency,

                mode:
                    CASHFREE_ENV

            });


        } catch (error) {


            console.error(
                "Cashfree Create Order Error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to create Cashfree payment.",

                error:
                    error.message

            });

        }

    }
);


// ============================================================
// CASHFREE RETURN URL
// ============================================================

router.get(
    "/cashfree-return",
    async function (req, res) {


        const orderId =
            req.query.order_id;


        if (!orderId) {

            return res.redirect(
                "/payment?payment=failed"
            );

        }


        // =====================================================
        // PAYMENT PAGE PAR ORDER ID KE SAATH RETURN
        // =====================================================

        return res.redirect(

            `/payment?payment=success&order_id=${encodeURIComponent(orderId)}`

        );

    }
);


// ============================================================
// VERIFY CASHFREE PAYMENT
// ============================================================

router.post(
    "/verify",
    async function (req, res) {


        try {


            const orderId =
                String(
                    req.body.order_id || ""
                ).trim();


            // =================================================
            // ORDER ID CHECK
            // =================================================

            if (!orderId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Cashfree order ID is required."

                });

            }


            // =================================================
            // GET CASHFREE ORDER
            // =================================================

            const orderResponse =
                await fetch(

                    `${CASHFREE_BASE_URL}/orders/${encodeURIComponent(orderId)}`,

                    {

                        method:
                            "GET",

                        headers: {

                            "Accept":
                                "application/json",

                            "x-api-version":
                                CASHFREE_API_VERSION,

                            "x-client-id":
                                CASHFREE_APP_ID,

                            "x-client-secret":
                                CASHFREE_SECRET_KEY

                        }

                    }

                );


            const orderData =
                await orderResponse.json();


            console.log(
                "Cashfree Order Status:",
                orderData
            );


            // =================================================
            // API ERROR
            // =================================================

            if (
                !orderResponse.ok
            ) {

                return res.status(
                    orderResponse.status
                ).json({

                    success: false,

                    message:
                        orderData.message ||
                        "Unable to verify Cashfree order.",

                    error:
                        orderData

                });

            }


            // =================================================
            // ORDER STATUS
            // =================================================

            const orderStatus =
                String(
                    orderData.order_status || ""
                ).toUpperCase();


            // =================================================
            // SUCCESS
            // =================================================

            if (
                orderStatus ===
                "PAID"
            ) {

                return res.json({

                    success:
                        true,

                    payment_status:
                        "SUCCESS",

                    order_id:
                        orderId,

                    order_status:
                        orderStatus

                });

            }


            // =================================================
            // PAYMENT NOT SUCCESS
            // =================================================

            return res.status(400).json({

                success:
                    false,

                payment_status:
                    orderStatus || "FAILED",

                order_id:
                    orderId,

                message:
                    "Payment was not successful."

            });


        } catch (error) {


            console.error(
                "Cashfree Verify Error:",
                error
            );


            return res.status(500).json({

                success:
                    false,

                message:
                    "Payment verification failed.",

                error:
                    error.message

            });

        }

    }
);


// ============================================================
// EXPORT
// ============================================================

module.exports =
    router;