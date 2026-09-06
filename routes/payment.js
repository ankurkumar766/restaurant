const express = require("express");
const router = express.Router();

const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


// ==================================================
// CREATE RAZORPAY ORDER
// ==================================================

router.post("/api/create-order", async (req, res) => {

    try {

        const { amount } = req.body;

        const amountInRupees = Number(amount);

        if (
            !Number.isFinite(amountInRupees) ||
            amountInRupees <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid amount"
            });
        }


        const amountInPaise =
            Math.round(amountInRupees * 100);


        if (amountInPaise < 100) {
            return res.status(400).json({
                success: false,
                message: "Minimum payment amount is ₹1"
            });
        }


        const razorpayOrder =
            await razorpay.orders.create({

                amount: amountInPaise,

                currency: "INR",

                receipt:
                    "ARFOOD_" + Date.now()

            });


        return res.json({

            success: true,

            order_id:
                razorpayOrder.id,

            amount:
                razorpayOrder.amount,

            currency:
                razorpayOrder.currency

        });


    } catch (error) {

        console.error(
            "Razorpay Create Order Error:",
            error
        );


        if (
            error.statusCode === 401 ||
            error.statusCode === 403
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Razorpay authentication failed."

            });

        }


        return res.status(500).json({

            success: false,

            message:
                "Unable to create Razorpay order."

        });

    }

});


// ==================================================
// VERIFY RAZORPAY PAYMENT
// ==================================================

router.post("/api/verify-payment", async (req, res) => {

    try {

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;


        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Missing payment verification fields."

            });

        }


        const body =
            razorpay_order_id +
            "|" +
            razorpay_payment_id;


        const expectedSignature =
            crypto
                .createHmac(
                    "sha256",
                    process.env.RAZORPAY_KEY_SECRET
                )
                .update(body)
                .digest("hex");


        if (
            expectedSignature !==
            razorpay_signature
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Payment verification failed."

            });

        }


        return res.json({

            success: true,

            message:
                "Payment verified successfully."

        });


    } catch (error) {

        console.error(
            "Razorpay Verify Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Payment verification error."

        });

    }

});


module.exports = router;