require("dotenv").config();

const express = require('express');
const app = express();
const mongoose = require("mongoose");
const path = require('path');
const multer = require('multer');
const User = require('./models/user');
const Listing = require('./models/listing');
const bcrypt = require('bcryptjs');
// const session = require("express-sesstion");
const MongoStroe = require("connect-mongo");
const Order = require("./models/order");
const authRoutes = require("./routes/authRoutes");
const Review = require("./models/review");
const nodemailer = require("nodemailer");
const adminRoutes = require("./routes/admin");
const sendTelegramMessage = require("./utils/telegram");
const sendEmail = require("./utils/sendEmail");
const aiRoutes = require("./routes/ai");





// ...
// const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/restaurants";
const dbUrl = process.env.ATLASDB_URI;

main()
   .then(()=>{
    console.log("connected to DB");
   })
   .catch((err)=>{
    console.log(err);
   });
   async function main(){
    await mongoose.connect(dbUrl);
   }


const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const flash = require("connect-flash");
const cartRoutes = require("./routes/cart");

const store = MongoStore.create({
  mongoUrl: dbUrl,
  touchAfter: 24 * 60 * 60,
  crypto: {
    secret: process.env.SESSION_SECRET,
  },
});


store.on("error",(err) => {
  console.log("error in MOngo session store",err);
});

const sessionConfig = {
  store,
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
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // ⚠️ Render पर temporary
app.use("/", authRoutes);
app.use("/ai", aiRoutes);
app.use("/cart", cartRoutes);

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
// =====================================================
// GEOCODE ADDRESS
// =====================================================

async function geocodeAddress(address) {

    const url =
        "https://nominatim.openstreetmap.org/search?" +
        new URLSearchParams({

            q: address,

            format: "jsonv2",

            limit: "1",

            countrycodes: "in"

        });


    const response = await fetch(url, {

        headers: {

            "User-Agent":
                "RestaurantDeliveryWebsite/1.0"

        }

    });


    if (!response.ok) {

        throw new Error(
            "Geocoding service failed"
        );

    }


    const data =
        await response.json();


    if (!data || data.length === 0) {

        return null;

    }


    return {

        latitude: Number(data[0].lat),

        longitude: Number(data[0].lon)

    };

}

function getDistance(lat1, lon1, lat2, lon2) {

    const R = 6371;

    const dLat = (lat2 - lat1) * Math.PI / 180;

    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =

        Math.sin(dLat / 2) *

        Math.sin(dLat / 2) +

        Math.cos(lat1 * Math.PI / 180) *

        Math.cos(lat2 * Math.PI / 180) *

        Math.sin(dLon / 2) *

        Math.sin(dLon / 2);

    const c =

        2 *

        Math.atan2(

            Math.sqrt(a),

            Math.sqrt(1 - a)

        );

    return R * c;

}


// Order route
app.post("/place-order", upload.none(), async (req, res) => {
  try {
   if (!req.user) {

    return res.status(401).json({

        success: false,

        message: "Please login first"

    });

}

const user = await User.findById(req.user._id);

if (!user.address) {
    return res.status(400).json({
        success: false,
        error: "Please add your address first."
    });
}

const distance = getDistance(
    Number(user.address.latitude),
    Number(user.address.longitude),
    24.47438,
    85.68874
);

console.log("User Latitude :", user.address.latitude);
console.log("User Longitude:", user.address.longitude);
console.log("Distance:", distance);


if (distance > 5) {

    return res.status(400).json({

        success: false,

        error:
            "Sorry! Delivery Available Only Within 5 KM Of Domchanch."

    });

}
    
   const items = JSON.parse(req.body.orderData || "[]").map(item => ({
    foodName: item.title,

    variation: item.variation || "Half",

    quantity: Number(item.quantity) || 1,

    price: Number(item.price)
}));
   

const otp = Math.floor(
    1000 + Math.random() * 9000
).toString();

const order = new Order({

    user:req.user._id,

    items,

    name:user.address.fullName,

    phone:user.address.phone,

    address:user.address.addressLine,

    paymentMethod:req.body.paymentMethod,

    totalPrice:Number(req.body.total),

    deliveryOTP: otp
});

    
   await order.save();

   await sendEmail(
    req.user.email,
    "🍔 Your Order Has Been Placed",

`Hello ${order.name},

Thank you for your order.

Order Status: Pending

We have received your order and will start preparing it soon.

Thank you for choosing our restaurant.

Team Restaurant`
);

const orderItems = order.items
    .map(item =>
        `• ${item.foodName}
   Size: ${item.variation}
   Qty: ${item.quantity}
   Price: ₹${item.price}`
    )
    .join("\n\n");

await sendTelegramMessage(
`🛒 <b>New Order Received</b>

👤 Customer: ${req.user.username}

📱 Phone: ${order.phone}

📍 Address:
${order.address}

💳 Payment: ${order.paymentMethod}

🍔 Items:
${orderItems}

💰 Total: ₹${order.totalPrice}

🕒 ${new Date().toLocaleString("en-IN")}`
);

console.log("✅ Order saved:", order);

res.status(200).json({ success: true });

} catch (err) {

    console.error("PLACE ORDER ERROR:");
    console.error(err);

    res.status(500).json({
        success: false,
        error: err.message
    });

}
});
// My Orders
app.get("/my-orders", async (req, res) => {
  try {
    if (!req.user) return res.redirect("/login");

    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.render("listings/myOrders.ejs", { orders });
  } catch (err) {
    console.log(err);
    res.send("My Orders load करने में error");
  }
});

// Handle new listing with image upload
app.post("/listings", upload.single("image"), async (req, res) => {
  try {
    const { title, description, halfPrice, fullPrice } = req.body;

    const filePath = "/uploads/" + req.file.filename;

    const newListing = new Listing({
      title,
      description,
      image: {
        filename: req.file.filename,
        url: filePath,
      },

      halfPrice,
      fullPrice,

      // Temporary (abhi ke liye)
      price: halfPrice,
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
app.use("/admin", adminRoutes);

// Updated route with file upload
app.put("/listings/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { title, description, halfPrice, fullPrice } = req.body;

  const updateData = {
    title,
    description,
    halfPrice,
    fullPrice,

    // Temporary (jab tak poori website shift nahi hoti)
    price: halfPrice,
  };

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
    const { id } = req.params;

    // const listing = await Listing.findById(id);
    const listing = await Listing.findById(id).populate("reviews");
    const keyword = listing.title.split(" ").pop();

const relatedListings = await Listing.find({
  title: { $regex: keyword, $options: "i" },
  _id: { $ne: id }
}).limit(6);

    // res.render("listings/show", { listing, relatedListings });
    res.render("listings/show", {
    listing,
    relatedListings,
    isAdmin: req.session.isAdmin
});
});
app.get("/listings/:id/cancle", async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/cancle.ejs", { listing });
});
app.get("/listings/:id/cart", async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user._id });
  res.render("listings/cart.ejs", { cart });
});

app.get("/about", (req, res) => {
  res.render("listings/about.ejs");
});
app.get("/payment", (req, res) => {
  res.render("listings/payment.ejs");
});
app.get("/chat", (req, res) => {
  res.render("listings/chat.ejs");
});
app.get("/address", (req, res) => {

    const cart = req.session.cart || [];

    let total = 0;

    cart.forEach(item => {
        total += item.price * (item.quantity || 1);
    });

    res.render("listings/address", {
        currentUser: req.user,
        cart,
        total
    });

});
app.get("/profile", (req, res) => {
  res.render("listings/profile.ejs", { currentUser: req.user });
});
app.get("/term", (req, res) => {
  res.render("listings/term.ejs");
});
app.get("/policy", (req, res) => {
  res.render("listings/policy.ejs");
});
app.get("/save", (req, res) => {
  res.render("listings/save.ejs");
});
// Signup
app.get("/signup", (req, res) => {
  res.render("listings/signup.ejs");
});
app.get("/dashboard", (req, res) => {
  res.render("admin/dashboard.ejs");
});
app.get("/user", (req, res) => {
  res.render("admin/user.ejs");
});
app.get("/orderHistory", (req, res) => {
  res.render("admin/orderHistory.ejs");
});
app.get("/order", (req, res) => {
  res.render("admin/order.ejs");
});
app.get("/adminLogin.ejs", (req, res) => {
  res.render("admin/adminLogin.ejs");
});
app.post("/listings/:id/reviews", async (req, res) => {

    if (!req.user) {
        req.flash("error", "Please login first!");
        return res.redirect("/login");
    }

    const listing = await Listing.findById(req.params.id);

    const review = new Review(req.body.review);

    review.author = req.user._id;

    await review.save();

    listing.reviews.push(review);

    await listing.save();

    req.flash("success", "Review Added Successfully!");

    res.redirect(`/listings/${listing._id}`);
});



app.post('/signup', async (req, res, next) => {
  try {

    const { email, username, password } = req.body;

    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

if(!emailRegex.test(email)){
  req.flash("error","Only valid Gmail addresses are allowed!");
  return res.redirect("/signup");
}

    const newUser = new User({ email, username });

    const registeredUser = await User.register(newUser, password);

    
    req.login(registeredUser, async (err) => {
  if (err) return next(err);

  await sendTelegramMessage(
`🆕 <b>New User Registered</b>

👤 Name: ${registeredUser.username}
📧 Email: ${registeredUser.email}

🕒 ${new Date().toLocaleString("en-IN")}`
  );

  req.flash("success", "Welcome to Restaurant!");
  res.redirect("/");
});

  } 
  catch (e) {
 
  if(e.code === 11000){
    req.flash("error","Email already registered!");
    return res.redirect("/signup");
  }

  req.flash("error", e.message);
  res.redirect("/signup");
}




});


// });





// Login
app.get("/login", (req, res) => {
  res.render("listings/login.ejs");
});
app.get("/forgot", (req, res)=> {
  res.render("listings/forgot.ejs");
});

app.post('/login', passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: true
}), (req, res) => {
 
  req.flash('success', 'Welcome back to Vatika Restaurant!');
  
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