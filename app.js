




const port = process.env.port || 8080;
const express = require('express');
const app = express();
const mongoose = require("mongoose");
const path = require('path');
const multer = require('multer');
const User = require('./models/user'); // सुनिश्चित करें कि आपका User मॉडल सही ढंग से इम्पोर्ट किया गया है
const Listing = require('./models/listing');
const bcrypt = require('bcryptjs'); // यदि आप मैन्युअल हैशिंग का उपयोग कर रहे हैं (Passport इसे खुद संभाल सकता है)
 const MONGO_URL = "mongodb://127.0.0.1:27017/restaurants";

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

// =========================================================
// Passport.js और Session से संबंधित इम्पोर्ट और कॉन्फ़िगरेशन
// =========================================================
const session = require('express-session');
const passport = require('passport'); // <--- यह लाइन जोड़ें
const LocalStrategy = require('passport-local'); // <--- यह लाइन जोड़ें
const flash = require('connect-flash'); // <--- यह लाइन जोड़ें

// Express सेशन कॉन्फ़िगरेशन
const sessionConfig = {
    secret: 'thisshouldbeabettersecret!', // एक मजबूत, प्रोडक्शन-ग्रेड सीक्रेट कुंजी
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true, // सुरक्षा के लिए
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 सप्ताह
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};
app.use(session(sessionConfig));
app.use(flash()); // Flash संदेशों का उपयोग करने के लिए

// Passport.js को इनिशियलाइज़ करें
app.use(passport.initialize());
app.use(passport.session()); // पासपोर्ट के लिए सेशंस को सक्षम करें


// यदि आप passport-local-mongoose का उपयोग नहीं कर रहे हैं, तो आपको authenticate, serializeUser, deserializeUser विधियों को मैन्युअल रूप से लागू करना होगा।
passport.use(new LocalStrategy(User.authenticate())); // User.authenticate() passport-local-mongoose द्वारा प्रदान किया जाता है
passport.serializeUser(User.serializeUser());   // User.serializeUser() passport-local-mongoose द्वारा प्रदान किया जाता है
passport.deserializeUser(User.deserializeUser()); // User.deserializeUser() passport-local-mongoose द्वारा प्रदान किया जाता है

// Flash संदेशों को सभी टेम्प्लेट में उपलब्ध कराने के लिए एक मिडलवेयर
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    // Passport द्वारा प्रदान किए गए req.user को सभी टेम्प्लेट में उपलब्ध कराएं
    res.locals.currentUser = req.user; 
    next();
});

// ... आपका मौजूदा Multer स्टोरेज कॉन्फ़िगरेशन ...
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// ... आपके अन्य app.use() मिडलवेयर (जैसे express.urlencoded, express.json, static files) ...
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
// app.get("/", (req, res) => {
//   res.send("hii i am root"); 
// });

// This is your main route to display all listings
app.get("/", async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings: allListings }); // This sends the response

  
});
//show Route
app.get("/listings/:id", async(req, res) => {
  let {id} = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/show.ejs", {listing});
});
//buy route
app.get("/listings/:id/buy", async(req, res) => {
let { id } = req.params;
const listing = await Listing.findById(id);
res.render("listings/buy.ejs", { listing });
});

//cancle route
app.get("/listings/:id/cancle", async(req, res) => {
let { id } = req.params;
const listing = await Listing.findById(id);
res.render("listings/cancle.ejs", { listing });
});


// =========================================================
// आपके रूट्स
// =========================================================

// Signup रूट
//signup page
app.get("/signup", (req, res) => {
    res.render("listings/signup.ejs");
});
app.post('/signup', async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const newUser = new User({ email, username });

        // User.register Passport-local-mongoose द्वारा प्रदान किया गया एक विधि है
        // जो उपयोगकर्ता को हैश किए गए पासवर्ड के साथ पंजीकृत करता है।
        const registeredUser = await User.register(newUser, password); 
        
        // एक बार पंजीकृत होने के बाद, उपयोगकर्ता को स्वचालित रूप से लॉग इन करें
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to Wanderlust!');
            res.redirect('/');
        });

    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/signup');
    }
});

// Login रूट
// ✅ LOGIN FORM 
app.get("/login", (req, res) => {
    res.render("listings/login.ejs");
});
app.post('/login', passport.authenticate('local', {
    failureRedirect: '/login', // असफल लॉगिन पर रीडायरेक्ट करें
    failureFlash: true         // असफल होने पर फ़्लैश संदेश दिखाएं
}), (req, res) => {
    req.flash('success', 'Welcome back to Wanderlust!');
    const redirectUrl = req.session.returnTo || '/'; // यदि कोई वापसी URL है
    delete req.session.returnTo; // सत्र से वापसी URL हटा दें
    res.redirect(redirectUrl);
});

// Logout रूट
app.get('/logout', (req, res, next) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        req.flash('success', 'Goodbye!');
        res.redirect('/');
    });
});

// ... आपके अन्य रूट्स ...

// सर्वर शुरू करें
// app.listen(8080, () => {
//   console.log("Server is listening to port 8080");
// });
app.listen(port,()=>{
  console.log(`server running on port ${port}`);
});