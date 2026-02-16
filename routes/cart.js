const express = require("express");
const router = express.Router();
const Listing = require("../models/listing");

// Add to cart
router.post("/:id", async (req, res) => {
    const listing = await Listing.findById(req.params.id);

    if(!req.session.cart){
        req.session.cart = [];
    }

    req.session.cart.push(listing);

    res.redirect("/cart");
});

// Show cart
router.get("/", (req, res) => {
    const cart = req.session.cart || [];
    res.render("listings/cart.ejs", { cart });
});

// Remove from cart
router.post("/remove/:index", (req, res) => {

    const index = req.params.index;

    if(req.session.cart){
        req.session.cart.splice(index, 1);
    }

    res.redirect("/cart");
});

// Checkout page
router.get("/checkout", (req, res) => {

    const total = req.query.total;

    res.render("listings/checkout.ejs", { total });

});




module.exports = router;
