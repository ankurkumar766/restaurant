const express = require('express');
const app = express();
const mongoose = require("mongoose");
const path = require('path');
const multer = require('multer');
const User = require('./models/user');
const Listing = require('./models/listing');
const bcrypt = require('bcryptjs');
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/restaurants";

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("✅ MongoDB connected");
}).catch(err => {
  console.error("❌ MongoDB connection error:", err);
});
// =========================================================
// Passport.js and Session
// =========================================================
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const flash = require('connect-flash');

const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'thisshouldbeabettersecret!',
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
};

app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.currentUser = req.user;
  next();
});

// =========================================================
// Multer Config (for file uploads)
// =========================================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // uploads folder me file save hogi
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // unique file name
  }
});
const upload = multer({ storage: storage });


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // ⚠️ Render पर temporary

// =========================================================
// Routes
// =========================================================
app.get("/", async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
});

// =========================================================
// Create New Listing (Form)
// =========================================================
app.get("/listings/new", (req, res) => {
  res.render("listings/new.ejs");
});

// Handle new listing with image upload
app.post("/listings", upload.single("image"), async (req, res) => {
  try {
    const { title, description, price } = req.body;
    const filePath = "/uploads/" + req.file.filename;

    const newListing = new Listing({
      title,
      description,
      image: {
        filename: req.file.filename,
        url: filePath,
      },
      price,
    });

    await newListing.save();
    req.flash("success", "New listing created!");
    res.redirect("/");
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong!");
    res.redirect("/listings/new");
  }
});

// =========================================================
// Edit Listing
// =========================================================
const methodOverride = require("method-override");
app.use(methodOverride("_method")); // agar pehle nahi lagaya

app.get("/listings/:id/edit", async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/");
  }
  res.render("listings/edit.ejs", { listing });
});

// Updated route with file upload
app.put("/listings/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { title, description, price } = req.body;

  const updateData = { title, description, price };

  // Agar user ne nayi image upload ki
  if (req.file) {
    updateData.image = {
      filename: req.file.filename,
      url: "/uploads/" + req.file.filename,
    };
  }

  await Listing.findByIdAndUpdate(id, updateData);

  req.flash("success", "Listing updated!");
  res.redirect(`/listings/${id}`);
});




app.get("/listings/:id", async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/show.ejs", { listing });
});

app.get("/listings/:id/buy", async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/buy.ejs", { listing });
});

app.get("/listings/:id/cancle", async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/cancle.ejs", { listing });
});

// Signup
app.get("/signup", (req, res) => {
  res.render("listings/signup.ejs");
});

app.post('/signup', async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    const newUser = new User({ email, username });
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

// Login
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
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
