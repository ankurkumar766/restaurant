const Listing = require("../models/listing");
const Order = require("../models/order");

// ================= MENU =================

async function getMenu() {

    const foods = await Listing.find({});

    if (!foods.length) {
        return "No food available.";
    }

    return foods.map(food => ({
        title: food.title,
        price: food.price,
        category: food.category || "Food"
    }));

}

// ================= SEARCH =================

async function searchFood(keyword) {

    const foods = await Listing.find({
        title: {
            $regex: keyword,
            $options: "i"
        }
    });

    if (!foods.length) {
        return "No matching food found.";
    }

    return foods.map(food => ({
        title: food.title,
        price: food.price
    }));

}

// ================= OFFERS =================

async function getOffers() {

    return [
        "🔥 Flat 20% OFF above ₹499",
        "🚚 Free Delivery above ₹299",
        "🥤 Free Cold Drink on Pizza Combo"
    ];

}

// ================= CONTACT =================

async function getContact() {

    return {
        phone: "+91-9876543210",
        email: "support@restaurant.com",
        address: "Your Restaurant Address"
    };

}

// ================= ORDER STATUS =================

async function getOrderStatus(orderId) {

    try {

        const order = await Order.findById(orderId);

        if (!order) {
            return "❌ Order not found.";
        }

        let items = "";

        order.items.forEach(food => {
            items += `🍔 ${food.foodName} - ₹${food.price}\n`;
        });

        return `📦 ORDER DETAILS

🆔 Order ID
${order._id}

👤 Name
${order.name}

📞 Phone
${order.phone}

📍 Address
${order.address}

💳 Payment
${order.paymentMethod}

📋 Status
${order.status}

🍽 Items

${items}

💰 Total
₹${order.totalPrice}
`;

    } catch (err) {

        return "❌ Invalid Order ID.";

    }

}

module.exports = {
    getMenu,
    searchFood,
    getOffers,
    getContact,
    getOrderStatus
};






 
