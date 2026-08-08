const ai = require("./gemini");
const SYSTEM_PROMPT = require("./prompt");
const tools = require("./tools");
const memory = require("./memory");
const Listing = require("../models/listing");

async function chat(userId, message) {

    memory.saveMessage(userId, "user", message);

    let reply = "";

    const text = message.trim();
    const lower = text.toLowerCase();

    // ==========================
    // GREETINGS
    // ==========================

    if (
        [
            "hi",
            "hello",
            "hey",
            "hii",
            "helo",
            "good morning",
            "good afternoon",
            "good evening"
        ].includes(lower)
    ) {

        reply = `👋 Hello! Welcome to AR Restaurant.

I'm your AI Assistant.

I can help you with:

🍔 Menu
🔍 Search Food
🎁 Offers
📦 Track Orders
📞 Contact

How can I help you today?`;

    }

    // ==========================
    // THANK YOU
    // ==========================

    else if (
        lower === "thanks" ||
        lower === "thank you" ||
        lower === "thx"
    ) {

        reply =
            "😊 You're welcome! Enjoy your meal. Let me know if you need anything else.";

    }

    // ==========================
    // BYE
    // ==========================

    else if (
        lower === "bye" ||
        lower === "goodbye" ||
        lower === "see you"
    ) {

        reply =
            "👋 Thank you for visiting AR Restaurant. Have a wonderful day.";

    }

    // ==========================
    // HELP
    // ==========================

    else if (
        lower.includes("help")
    ) {

        reply = `
🤖 I can help you with:

🍔 menu

🔍 search pizza

🎁 offers

📞 contact

📦 order status

💰 food under ₹200

🥗 veg food

🍗 chicken food

🍕 pizza

🍔 burger

Example:

menu

search burger

track order

offers
`;

    }

    // ==========================
    // MENU
    // ==========================

    else if (
        lower === "menu" ||
        lower.includes("show menu") ||
        lower.includes("food menu") ||
        lower.includes("menu please")
    ) {

        const menu = await tools.getMenu();

        if (typeof menu === "string") {

            reply = menu;

        } else {

            reply = menu.map(food =>

                `🍽 ${food.title}
₹${food.price}
${food.category}`

            ).join("\n\n");

        }

    }

    // ==========================
    // SEARCH
    // ==========================

    else if (
        lower.startsWith("search ")
    ) {

        const keyword = text.substring(7).trim();

        const foods = await tools.searchFood(keyword);

        if (typeof foods === "string") {

            reply = foods;

        } else {

            reply = foods.map(food =>

                `🍔 ${food.title}
₹${food.price}`

            ).join("\n\n");

        }

    }

    // ==========================
    // OFFERS
    // ==========================

    else if (
        lower.includes("offer") ||
        lower.includes("discount")
    ) {

        const offers = await tools.getOffers();

        reply = offers.join("\n");

    }

    // ==========================
    // CONTACT
    // ==========================

    else if (
        lower.includes("contact") ||
        lower.includes("phone") ||
        lower.includes("address")
    ) {

        const contact = await tools.getContact();

        reply = `📞 Phone : ${contact.phone}

📧 Email : ${contact.email}

📍 Address : ${contact.address}`;

    }

    // ==========================
    // ORDER STATUS
    // ==========================

    else if (

        lower.includes("order") ||
        lower.includes("track") ||
        lower.includes("status")

    ) {

        const objectIdRegex = /[0-9a-fA-F]{24}/;

        const match = text.match(objectIdRegex);

        if (!match) {

            reply = `📦 Please send your Order ID.

Example:

686f7ab63d9d30c40d6d1234`;

        }

        else {

            reply = await tools.getOrderStatus(match[0]);

        }

    }

    // ==========================
    // ONLY ORDER ID
    // ==========================

    else if (
        /^[0-9a-fA-F]{24}$/.test(text)
    ) {

        reply = await tools.getOrderStatus(text);

    }

   
    // BUDGET SEARCH
    // ==========================

    else if (
        lower.includes("under") ||
        lower.includes("below") ||
        lower.includes("less than")
    ) {

        const match = text.match(/\d+/);

        if (match) {

            const maxPrice = Number(match[0]);

            const foods = await Listing.find({
                price: { $lte: maxPrice }
            });

            if (!foods.length) {

                reply = `😔 No food found under ₹${maxPrice}.`;

            } else {

                reply = `🍽 Food under ₹${maxPrice}\n\n`;

                foods.forEach(food => {

                    reply += `🍔 ${food.title}
₹${food.price}

`;

                });

            }

        } else {

            reply = "Please specify a budget.\nExample: food under 200";

        }

    }

    // ==========================
    // VEG
    // ==========================

   else if (lower.includes("veg")) {

    reply = `🥗 Veg Menu

1. maggi - 25
2. Maggi masala -45
3.veg pasta- 90
4. cheese pasta-125
5. Chole Bhature - 35
6. Veg Biryani - ₹180
7. veg pakoda - ₹80
8. Dal Tadka full - ₹220
9. plane roti
10. dosa
11. Rice
12. pizza
13. Burger
14.paneer
15.noodles
16. Biryani
And many more items available in our restaurant. you can go home page and check the menu by seaching the food you want.

`;

}

    // ==========================
    // BURGER
    // ==========================

    else if (
        lower.includes("burger")
    ) {

        const foods = await Listing.find({
            title: /burger/i
        });

        if (!foods.length) {

            reply = "🍔 No Burger available.";

        } else {

            reply = "🍔 Burger Menu\n\n";

            foods.forEach(food => {

                reply += `• ${food.title} - ₹${food.price}\n`;

            });

        }

    }

    // ==========================
    // PIZZA
    // ==========================

    else if (
        lower.includes("pizza")
    ) {

        const foods = await Listing.find({
            title: /pizza/i
        });

        if (!foods.length) {

            reply = "🍕 No Pizza available.";

        } else {

            reply = "🍕 Pizza Menu\n\n";

            foods.forEach(food => {

                reply += `• ${food.title} - ₹${food.price}\n`;

            });

        }

    }

    // ==========================
    // CHICKEN
    // ==========================

    else if (
        lower.includes("chicken")
    ) {

        const foods = await Listing.find({
            title: /chicken/i
        });

        if (!foods.length) {

            reply = "🍗 No Chicken item available.";

        } else {

            reply = "🍗 Chicken Menu\n\n";

            foods.forEach(food => {

                reply += `• ${food.title} - ₹${food.price}\n`;

            });

        }

    }

    // ==========================
    // TODAY SPECIAL
    // ==========================

    else if (
        lower.includes("special")
    ) {

        const foods = await Listing.find().limit(5);

        reply = "⭐ Today's Specials\n\n";

        foods.forEach(food => {

            reply += `🍽 ${food.title} - ₹${food.price}\n`;

        });

    }

    // ==========================
    // GEMINI
    // ==========================

    else {

        const history = memory.getHistory(userId);

        const prompt = `

${SYSTEM_PROMPT}

Conversation

${history.map(h => `${h.role}: ${h.message}`).join("\n")}

User:

${message}

Assistant:
`;

        try {

            const response = await ai.models.generateContent({

                  model: "gemini-3.5-flash",

                contents: prompt

            });

            reply =
                response.text ||
                response.candidates?.[0]?.content?.parts?.[0]?.text ||
                "Sorry, I couldn't understand that.";

        }

        catch (err) {

            console.log("Gemini Error:", err.message);

            reply = `😊 Sorry, Currently i am not connected to the Gemini API or internet.

 Now,You can ask me:

🍔 Menu

🔍 Search dishes

🎁 Offers

📦 Track Order

📞 Contact

💰 Food under ₹200

🥗 Veg Food`;

        }

    }

    memory.saveMessage(userId, "assistant", reply);

    return reply;

}

module.exports = {
    chat
};