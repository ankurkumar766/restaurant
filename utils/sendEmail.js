const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

async function sendEmail(to, subject, text) {
    try {

        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to,
            subject,
            text
        });

        console.log("✅ Email Sent Successfully");

    } catch (err) {

        console.log("Email Error:", err);

    }
}

module.exports = sendEmail;