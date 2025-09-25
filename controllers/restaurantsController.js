// controllers/restaurantsController.js
const Restaurant = require("../models/restaurant"); // mongoose model
const cloudinary = require("../config/cloudinary");

exports.createRestaurant = async (req, res) => {
  try {
    // 1. Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "restaurant_app"
    });

    // 2. Save restaurant with Cloudinary permanent URL
    const restaurant = new Restaurant({
      name: req.body.name,
      description: req.body.description,
      image: result.secure_url, // permanent link
      createdBy: req.user._id
    });

    await restaurant.save();
    res.redirect("/restaurants");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating restaurant");
  }
};
