const express = require("express");
const router = express.Router();

const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


// ==========================================
// CREATE RAZORPAY ORDER
// ==========================================

router.post("/create-payment", async (req, res) => {

    try {

        const { amount } = req.body;

        if (!amount || Number(amount) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid amount"
            });
        }

        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(Number(amount) * 100),
            currency: "INR",
            receipt: "ARFOOD_" + Date.now()
        });

        res.json({
            success: true,
            order: razorpayOrder
        });

    } catch (error) {

        console.error(
            "Razorpay Create Order Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Unable to create payment"
        });
    }
});


// ==========================================
// VERIFY RAZORPAY PAYMENT
// ==========================================

router.post("/verify-payment", async (req, res) => {

    try {

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;


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
            expectedSignature ===
            razorpay_signature
        ) {

            return res.json({
                success: true,
                message: "Payment verified"
            });
        }


        return res.status(400).json({
            success: false,
            message: "Payment verification failed"
        });


    } catch (error) {

        console.error(
            "Razorpay Verify Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Payment verification error"
        });
    }
});


module.exports = router;