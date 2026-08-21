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


// ==========================================
// DELIVERY CENTER
// ==========================================

const DELIVERY_CENTER = {
    lat: 24.47438,
    lng: 85.68874
};


// ==========================================
// DISTANCE FUNCTION
// ==========================================

function getDistance(lat1, lon1, lat2, lon2) {

    const R = 6371;

    const dLat =
        (lat2 - lat1) *
        Math.PI / 180;

    const dLon =
        (lon2 - lon1) *
        Math.PI / 180;

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


// ==========================================
// KNOWN LOCAL DELIVERY AREAS
// ==========================================

const knownDeliveryAreas = [

    "mahthadih",
    "mahtahadih",

    "ganpati chowk",
    "ganpati",

    "shahid chowk",
    "shaheed chowk",

    "sbi bank",
    "sbi",

    "domchanch",
    "domchanch bazar"

];


// ==========================================
// CHECK KNOWN AREA
// ==========================================

function isKnownDeliveryArea(address) {

    const normalizedAddress =
        address.toLowerCase();

    return knownDeliveryAreas.some(area =>
        normalizedAddress.includes(area)
    );

}


// ==========================================
// FIND LOCATION FROM NOMINATIM
// ==========================================

async function findLocation(address) {

    const cleanAddress =
        address
            .replace(/^\d+\s*,?\s*/, "")
            .trim();


    const searchQueries = [

        `${address}, Domchanch, Kodarma, Jharkhand, India`,

        `${cleanAddress}, Domchanch, Kodarma, Jharkhand, India`,

        `${cleanAddress}, Domchanch, Jharkhand, India`,

        `${cleanAddress}, Kodarma, Jharkhand, India`,

        `${cleanAddress}, India`

    ];


    for (const query of searchQueries) {

        console.log("Searching:", query);


        try {

            const url =
                "https://nominatim.openstreetmap.org/search?" +
                new URLSearchParams({

                    q: query,

                    format: "jsonv2",

                    limit: "5",

                    countrycodes: "in",

                    addressdetails: "1"

                });


            const response =
                await fetch(url, {

                    headers: {

                        "User-Agent":
                            "RestaurantWebsite/1.0"

                    }

                });


            if (!response.ok) {

                continue;

            }


            const results =
                await response.json();


            console.log(
                "Results:",
                results.length
            );


            if (results.length > 0) {

                console.log(
                    "Location Found:",
                    results[0].display_name
                );


                return {

                    found: true,

                    lat:
                        Number(results[0].lat),

                    lng:
                        Number(results[0].lon),

                    displayName:
                        results[0].display_name,

                    source:
                        "geocoding"

                };

            }


        } catch (error) {

            console.log(
                "Location search error:",
                error.message
            );

        }

    }


    return null;

}
router.post(
    "/save-address",
    upload.none(),

    async (req, res) => {

        try {

            console.log(
                "ADDRESS:",
                req.body
            );


            // ==========================================
            // LOGIN CHECK
            // ==========================================

            if (!req.user) {

                return res.status(401).json({

                    success: false,

                    error:
                        "Please login first."

                });

            }


            // ==========================================
            // GET USER INPUT
            // ==========================================

            const {

                name,

                phone,

                address

            } = req.body;


            // ==========================================
            // BASIC VALIDATION
            // ==========================================

            if (
                !name ||
                !phone ||
                !address
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Please fill all address details."

                });

            }


            // ==========================================
            // FIND DELIVERY LOCATION
            // ==========================================

            const location =
                await findLocation(address);


            let userLat;

            let userLng;

            let locationSource;


            // ==========================================
            // CASE 1:
            // EXACT LOCATION FOUND
            // ==========================================

            if (location) {

                userLat =
                    location.lat;

                userLng =
                    location.lng;

                locationSource =
                    "exact-geocoding";


                console.log(
                    "Exact Location Found:"
                );

                console.log(
                    location.displayName
                );

            }


            // ==========================================
            // CASE 2:
            // LOCAL LANDMARK FALLBACK
            // ==========================================

            else if (
                isKnownDeliveryArea(address)
            ) {

                console.log(
                    "Using Domchanch local area fallback"
                );


                /*
                    Nominatim may not contain
                    Ganpati Chowk / Shahid Chowk /
                    SBI etc.

                    These are known local delivery
                    areas, so fallback is used.
                */

                userLat =
                    DELIVERY_CENTER.lat;

                userLng =
                    DELIVERY_CENTER.lng;

                locationSource =
                    "known-local-area";


            }


            // ==========================================
            // CASE 3:
            // ADDRESS NOT FOUND
            // ==========================================

            else {

                return res.status(400).json({

                    success: false,

                    error:
                        "Address could not be verified. Please enter a complete address with a nearby landmark."

                });

            }


            console.log(
                "Final Latitude:",
                userLat
            );

            console.log(
                "Final Longitude:",
                userLng
            );

            console.log(
                "Location Source:",
                locationSource
            );


            // ==========================================
            // CALCULATE DISTANCE
            // ==========================================

            const distance =
                getDistance(

                    DELIVERY_CENTER.lat,

                    DELIVERY_CENTER.lng,

                    userLat,

                    userLng

                );


            console.log(
                "Distance:",
                distance.toFixed(2),
                "KM"
            );


            // ==========================================
            // 5 KM CHECK
            // ==========================================

            if (distance > 5) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Sorry! Delivery is available only within 5 KM of Domchanch."

                });

            }


            // ==========================================
            // SAVE ADDRESS
            // ==========================================

            const user =
                await User.findById(
                    req.user._id
                );


            user.address = {

                fullName:
                    name,

                phone:
                    phone,

                addressLine:
                    address,

                latitude:
                    userLat,

                longitude:
                    userLng,

                locationSource:
                    locationSource

            };


            await user.save();


            // ==========================================
            // SUCCESS
            // ==========================================

            return res.json({

                success: true,

                distance:
                    Number(
                        distance.toFixed(2)
                    ),

                message:
                    "Delivery is available at this address."

            });


        } catch (error) {

            console.log(
                "SAVE ADDRESS ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                error:
                    "Unable to verify address. Please try again."

            });

        }

    }
);
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
