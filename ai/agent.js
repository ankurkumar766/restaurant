const ai = require("./gemini");
const SYSTEM_PROMPT = require("./prompt");
const tools = require("./tools");
const memory = require("./memory");

async function chat(userId, message) {

    memory.saveMessage(userId, "user", message);

    let reply = "";
    const lower = message.toLowerCase();

    // ================= MENU =================

    if (message.startsWith("@menu")) {

        const menu = await tools.getMenu();

        reply = JSON.stringify(menu, null, 2);

    }

    // ================= SEARCH =================

    else if (message.startsWith("@search")) {

        const keyword = message.replace("@search", "").trim();

        const result = await tools.searchFood(keyword);

        reply = JSON.stringify(result, null, 2);

    }

    // ================= OFFERS =================

    else if (message.startsWith("@offers")) {

        const offers = await tools.getOffers();

        reply = offers.join("\n");

    }

    // ================= CONTACT =================

    else if (message.startsWith("@contact")) {

        const contact = await tools.getContact();

        reply = `📞 Phone : ${contact.phone}

📧 Email : ${contact.email}

📍 Address : ${contact.address}`;

    }

    // ================= HELP =================

    else if (message.startsWith("@help")) {

        reply = `
🤖 Available Commands

@menu

@search pizza

@offers

@contact

@help

You can also ask:

• Where is my order?
• Track my order
• Order status
`;

    }

    // ================= ORDER =================

    else if (

        lower.includes("order") ||
        lower.includes("track") ||
        lower.includes("status")

    ) {

        const objectIdRegex = /[0-9a-fA-F]{24}/;

        const match = message.match(objectIdRegex);

        if (!match) {

            reply = `📦 Please send your Order ID.

Example:

686f7ab63d9d30c40d6d1234`;

        }

        else {

            reply = await tools.getOrderStatus(match[0]);

        }

    }

    // ================= ONLY ORDER ID =================

    else if (/^[0-9a-fA-F]{24}$/.test(message.trim())) {

        reply = await tools.getOrderStatus(message.trim());

    }

    // ================= GEMINI =================

    else {

        const history = memory.getHistory(userId);

        const prompt = `
${SYSTEM_PROMPT}

Conversation:

${history.map(h => `${h.role}: ${h.message}`).join("\n")}

User:
${message}
`;

        const response = await ai.models.generateContent({

          model: "gemini-3.5-flash",

            contents: prompt

        });

        reply =
            response.text ||
            response.candidates?.[0]?.content?.parts?.[0]?.text ||
            "No response";

    }

    memory.saveMessage(userId, "assistant", reply);

    return reply;

}

module.exports = {
    chat
};