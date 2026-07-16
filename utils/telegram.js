const axios = require("axios");

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegramMessage(message) {
    try {
        await axios.post(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
            {
                chat_id: CHAT_ID,
                text: message,
                parse_mode: "HTML",
            }
        );

        console.log("Telegram Notification Sent");
    } catch (err) {
        console.log("Telegram Error:", err.response?.data || err.message);
    }
}

module.exports = sendTelegramMessage;