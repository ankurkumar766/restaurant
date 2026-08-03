const express = require("express");
const router = express.Router();
const Listing = require("../models/listing");
const User=require("../models/user");
const multer = require("multer");
const upload = multer();





router.get("/", (req, res) => {

    const cart = req.session.cart || [];

    res.render("listings/cart.ejs", {
        cart,
        currentUser: req.user
    });

});

// Remove from cart
router.post("/remove/:index", (req, res) => {

    const index = req.params.index;

    if(req.session.cart){
        req.session.cart.splice(index, 1);
    }

    res.redirect("/cart");
});


router.post("/save-address", upload.none(), async (req, res) => {
    console.log(req.body);

    if (!req.user) {
        return res.status(401).json({ success: false });
    }

    const user = await User.findById(req.user._id);

    user.address = {
        fullName: req.body.name,
        phone: req.body.phone,
        addressLine: req.body.address,
        latitude: Number(req.body.latitude),
        longitude: Number(req.body.longitude)
    };

    await user.save();

    res.json({ success: true });
});
// Add to cart
router.post("/:id", async (req, res) => {

    const listing = await Listing.findById(req.params.id);

    if (!req.session.cart) {
        req.session.cart = [];
    }

    const cartItem = {
        _id: listing._id,
        title: listing.title,
        description: listing.description,
        image: listing.image,

        variation: req.body.variation,   // Half ya Full

        price: Number(req.body.price),   // Selected price
    };

    req.session.cart.push(cartItem);

    res.redirect("/cart");
});

// Checkout page
router.get("/checkout", (req, res) => {

    const total = req.query.total;

    res.render("listings/checkout.ejs", { total });

});
module.exports = router;
