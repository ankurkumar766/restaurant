const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        foodName: String,
        price: Number,
      }
    ],
    name: String,
    phone: String,
    address: String,
    paymentMethod: String,
    totalPrice: Number,
  },
  { timestamps: true } // createdAt, updatedAt auto add होंगे
);

module.exports = mongoose.model("Order", orderSchema);
