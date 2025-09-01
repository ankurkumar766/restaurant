// test.js
require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
  console.error("❌ MONGO_URL not found in .env file");
  process.exit(1);
}

mongoose.connect(MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log("✅ Test: MongoDB connected successfully");
  process.exit(0);
})
.catch(err => {
  console.error("❌ Test: MongoDB connection error:", err);
  process.exit(1);
});
