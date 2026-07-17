// const mongoose = require("mongoose");

// const orderSchema = new mongoose.Schema({
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true
//   },
//   items: [
//     {
//       foodName: String,
//       price: Number
//     }
//   ],
//   name: String,
//   phone: String,
//   address: String,
//   paymentMethod: String,
//   totalPrice: Number,
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },isSeen:{
//     type:Boolean,
//     default:false
// },
  
// });

// module.exports = mongoose.model("Order", orderSchema);

const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  items: [
    {
      foodName: String,
      price: Number
    }
  ],

  name: String,
  phone: String,
  address: String,
  paymentMethod: String,
  totalPrice: Number,

  // ✅ Order Status
  status: {
    type: String,
    enum: ["Pending", "Out for Delivery", "Delivered"],
    default: "Pending"
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  isSeen: {
    type: Boolean,
    default: false
  }

});

module.exports = mongoose.model("Order", orderSchema);
