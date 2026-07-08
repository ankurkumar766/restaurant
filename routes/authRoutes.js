// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/user");
const nodemailer = require("nodemailer");

// Render forgot page
router.get("/forgot", (req, res) => {
  res.render("listings/forgot.ejs", { message: null, alertType: null });
});

// Send OTP
router.post("/forgot", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.render("listings/forgot.ejs", { message: "Please provide email", alertType: "error" });

    const user = await User.findOne({ email });
    if (!user) return res.render("listings/forgot.ejs", { message: "Email not found!", alertType: "error" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Configure transporter using env vars
    const { Resend } = require("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
   try {

    await resend.emails.send({
        from: "onboarding@resend.dev",
        to: user.email,
        subject: "OTP for Password Reset",
        html: `
        <div style="font-family:Arial,sans-serif;padding:20px">

            <h2>Password Reset OTP</h2>

            <p>Your OTP is:</p>

            <h1 style="letter-spacing:8px;color:#dc2626;">
                ${otp}
            </h1>

            <p>This OTP is valid for <b>10 minutes</b>.</p>

            <p>If you did not request a password reset, please ignore this email.</p>

        </div>
        `
    });

    console.log("Password Reset OTP Sent");

} catch (err) {

    console.error("Resend Error:", err);

    req.flash("error", "Unable to send OTP. Please try again.");

    return res.redirect("/forgot-password");

}

    return res.render("listings/verifyOtp.ejs", {
      email: user.email,
      message: "OTP sent to your email!",
      alertType: "success",
    });
  } catch (err) {
    console.error("Error in /forgot:", err);
    return res.render("listings/forgot.ejs", { message: "Something went wrong", alertType: "error" });
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user || !user.otp || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.render("listings/verifyOtp.ejs", { email, message: "Invalid or expired OTP!", alertType: "error" });
    }

    // OTP ok -> show reset password
    return res.render("listings/resetPassword.ejs", { email, message: "OTP verified. Set new password.", alertType: "success" });
  } catch (err) {
    console.error("Error in /verify-otp:", err);
    return res.render("listings/verifyOtp.ejs", { email: req.body.email || "", message: "Error verifying OTP", alertType: "error" });
  }
});

// Reset password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.render("listings/resetPassword.ejs", { email, message: "Fill all fields", alertType: "error" });

    const user = await User.findOne({ email });
    if (!user) return res.render("listings/resetPassword.ejs", { email, message: "User not found", alertType: "error" });

    user.setPassword(password, async (err) => {
      if (err) {
        console.error("setPassword error:", err);
        return res.render("listings/resetPassword.ejs", { email, message: "Error resetting password", alertType: "error" });
      }
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();

      return res.render("listings/login.ejs", { message: "Password reset successful! Please login.", alertType: "success" });
    });
  } catch (err) {
    console.error("Error in /reset-password:", err);
    return res.render("listings/resetPassword.ejs", { email: req.body.email || "", message: "Something went wrong", alertType: "error" });
  }
});




module.exports = router;
