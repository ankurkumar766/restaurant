const express = require("express");
const router = express.Router();
const Listing = require("../models/listing");
const User=require("../models/user");
const multer = require("multer");
const upload = multer();

router.get("/clear", (req, res) => {
    req.session.cart = [];
    res.send("Cart Cleared");
});
router.get("/", (req, res) => {

    console.log("SESSION CART:");
    console.log(req.session.cart);

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

    try {

        console.log("ADDRESS:", req.body);


        // ===============================
        // LOGIN CHECK
        // ===============================

        if (!req.user) {

            return res.status(401).json({

                success: false,

                error: "Please login first."

            });

        }


        // ===============================
        // GET USER INPUT
        // ===============================

        const {
            name,
            phone,
            address
        } = req.body;


        // ===============================
        // BASIC VALIDATION
        // ===============================

        if (!name || !phone || !address) {

            return res.status(400).json({

                success: false,

                error: "Please fill all address details."

            });

        }


        // ===============================
        // GEOCODE ADDRESS
        // ===============================

        const query =
            `${address}, India`;


        const url =
            "https://nominatim.openstreetmap.org/search?" +
            new URLSearchParams({

                q: query,

                format: "jsonv2",

                limit: "1",

                countrycodes: "in"

            });


        const geoResponse =
            await fetch(url, {

                headers: {

                    "User-Agent":
                        "RestaurantWebsite/1.0"

                }

            });


        if (!geoResponse.ok) {

            throw new Error(
                "Geocoding service failed"
            );

        }


        const geoData =
            await geoResponse.json();


        // ===============================
        // ADDRESS NOT FOUND
        // ===============================

        if (!geoData || geoData.length === 0) {

            return res.status(400).json({

                success: false,

                error:
                    "Address not found. Please enter complete address with Domchanch, Koderma, Jharkhand."

            });

        }


        // ===============================
        // USER COORDINATES
        // ===============================

        const userLat =
            Number(geoData[0].lat);

        const userLng =
            Number(geoData[0].lon);


        console.log(
            "User Latitude:",
            userLat
        );

        console.log(
            "User Longitude:",
            userLng
        );


        // ===============================
        // DOMCHANCH COORDINATES
        // ===============================

        const domchanchLat =
            24.47438;

        const domchanchLng =
            85.68874;


        // ===============================
        // DISTANCE FUNCTION
        // ===============================

        const R = 6371;

        const dLat =
            (userLat - domchanchLat)
            * Math.PI / 180;

        const dLng =
            (userLng - domchanchLng)
            * Math.PI / 180;


        const a =

            Math.sin(dLat / 2) *
            Math.sin(dLat / 2) +

            Math.cos(
                domchanchLat * Math.PI / 180
            ) *

            Math.cos(
                userLat * Math.PI / 180
            ) *

            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);


        const c =
            2 *
            Math.atan2(
                Math.sqrt(a),
                Math.sqrt(1 - a)
            );


        const distance =
            R * c;


        console.log(
            "Distance from Domchanch:",
            distance,
            "KM"
        );


        // ===============================
        // 5 KM CHECK
        // ===============================

        if (distance > 5) {

            return res.status(400).json({

                success: false,

                error:
                    "Sorry! Delivery is available only within 5 KM of Domchanch."

            });

        }


        // ===============================
        // SAVE ADDRESS
        // ===============================

        const user =
            await User.findById(req.user._id);


        user.address = {

            fullName: name,

            phone: phone,

            addressLine: address,

            latitude: userLat,

            longitude: userLng

        };


        await user.save();


        // ===============================
        // SUCCESS
        // ===============================

        res.json({

            success: true,

            distance:
                Number(distance.toFixed(2))

        });


    } catch (error) {

        console.log(
            "SAVE ADDRESS ERROR:",
            error
        );


        res.status(500).json({

            success: false,

            error:
                "Unable to verify address. Please try again."

        });

    }

});
// Add to cart
router.post("/:id", async (req, res) => {
     console.log(req.body); 

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
