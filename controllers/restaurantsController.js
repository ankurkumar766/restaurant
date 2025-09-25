// controllers/restaurantsController.js
const Restaurant = require("../models/restaurant");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

exports.createRestaurant = async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("Image is required");

    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "restaurant_app"
    });

    // Delete temp file
    fs.unlinkSync(req.file.path);

    // Save to DB
    const restaurant = new Restaurant({
      name: req.body.name,
      description: req.body.description,
      image: result.secure_url,
      createdBy: req.user._id // agar auth use kar rahe ho
    });

    await restaurant.save();
    res.redirect("/restaurants");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating restaurant");
  }
};

exports.updateRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).send("Restaurant not found");

    // Update name/description
    restaurant.name = req.body.name || restaurant.name;
    restaurant.description = req.body.description || restaurant.description;

    // If new image uploaded
    if (req.file) {
      // Upload new image
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "restaurant_app"
      });
      fs.unlinkSync(req.file.path);

      // Replace image
      restaurant.image = result.secure_url;
    }

    await restaurant.save();
    res.redirect("/restaurants");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating restaurant");
  }
};
