const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

// const MONGO_URL = "mongodb://127.0.0.1:27017/restaurants";
// const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/restaurants";


// main()
//   .then(() => {
//     console.log("connected to DB");
//   })
//   .catch((err) => {
//     console.log(err);
//   });

// async function main() {
//   await mongoose.connect(MONGO_URL);
// }
const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/restaurants";

mongoose.connect(MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("✅ MongoDB connected");
}).catch(err => {
  console.error("❌ MongoDB connection error:", err);
});




const initDB = async () => {
  await Listing.deleteMany({});
  initData.data = initData.data.map((obj) => ({...obj, owner: "685e4e3fd85408b62d2748c9"}));
  await Listing.insertMany(initData.data);
  console.log("data was initialized");
};

initDB();