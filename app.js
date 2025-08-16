




const port = process.env.port || 8080;
const express = require('express');
const app = express();
const mongoose = require("mongoose");
const path = require('path');
const multer = require('multer');
const User = require('./models/user'); 
const Listing = require('./models/listing');
const bcrypt = require('bcryptjs'); 
// const session = require('express-session');
// const MongoStore = require('connect-mongo');

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
// Passport.js और Session से संबंधित इम्पोर्ट
// =========================================================
const session = require('express-session');
const passport = require('passport'); 
const LocalStrategy = require('passport-local'); 
const flash = require('connect-flash'); 

// Express session
const sessionConfig = {
    secret: 'thisshouldbeabettersecret!', 
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true, // सुरक्षा के लिए
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("✅ Connected to MongoDB Atlas");
}).catch(err => {
  console.error("❌ MongoDB connection error:", err);
});



app.use(session(sessionConfig));
app.use(flash()); 

// Passport.js of initialize
app.use(passport.initialize());
app.use(passport.session()); 


//If you are not using passport-local-mongoose , you will have to manually implement the authenticate, serializeUser, deserializeUser methods.
passport.use(new LocalStrategy(User.authenticate())); // User.authenticate() passport-local-mongoose 
passport.serializeUser(User.serializeUser());   // User.serializeUser() passport-local-mongoose 
passport.deserializeUser(User.deserializeUser()); // User.deserializeUser() passport-local-mongoose 

// A middleware to make Flash messages available in all templates
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    // Make req.user provided by Passport available in all templates
    res.locals.currentUser = req.user; 
    next();
});

// ... Your existing Multer storage configuration...
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// ... Your other app.use() middleware (such as express.urlencoded, express.json, static files) ...
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

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




// Signup route
//signup page
app.get("/signup", (req, res) => {
    res.render("listings/signup.ejs");
});
app.post('/signup', async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const newUser = new User({ email, username });

        // User.register is a method provided by passport-local-mongoose
        // Which registers the user with the hashed password.
        const registeredUser = await User.register(newUser, password); 
        
        
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

// Login route

// ✅ LOGIN FORM 
app.get("/login", (req, res) => {
    res.render("listings/login.ejs");
});
app.post('/login', passport.authenticate('local', {
    failureRedirect: '/login', 
    failureFlash: true         
}), (req, res) => {
    req.flash('success', 'Welcome back to Wanderlust!');
    const redirectUrl = req.session.returnTo || '/'; 
    delete req.session.returnTo; 
    res.redirect(redirectUrl);
});

// Logout 
app.get('/logout', (req, res, next) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        req.flash('success', 'Goodbye!');
        res.redirect('/');
    });
});


app.listen(8080, () => {
  console.log("Server is listening to port 8080");

});
