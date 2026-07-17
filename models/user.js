



const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({

    email:{
        type:String,
        required:true,
        unique:true
    },
   

    otp:String,

    otpExpires:Date,

    isVerified:{
        type:Boolean,
        default:false
    },

    address:{

        fullName:String,

        phone:String,

        addressLine:String

    }

});
userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User",userSchema);