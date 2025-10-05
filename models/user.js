const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    }
  //     otp: String,
  // otpExpires: Date
});
userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model(`User`,userSchema); 


// models/User.js
// const mongoose = require("mongoose");
// const passportLocalMongoose = require("passport-local-mongoose");

// const userSchema = new mongoose.Schema({
//   email: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   otp: String,
//   otpExpires: Date
// });

// // ⚡ usernameField=email because we use email for login
// userSchema.plugin(passportLocalMongoose, { usernameField: "email" });

// module.exports = mongoose.model("User", userSchema);
