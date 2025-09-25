const Restaurant = require("../models/restaurant");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

// Create new restaurant
exports.createRestaurant = async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("Image is required");

    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "restaurant_app" // Cloudinary folder
    });

    // Delete temp file from server
    fs.unlinkSync(req.file.path);

    // Save restaurant in DB
    const restaurant = new Restaurant({
      name: req.body.name,
      description: req.body.description,
      image: result.secure_url, // permanent Cloudinary URL
      createdBy: req.user ? req.user._id : null
    });

    await restaurant.save();
    res.redirect("/restaurants"); // or json response
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating restaurant");
  }
};

// Update existing restaurant
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

      // Replace image URL
      restaurant.image = result.secure_url;
    }

    await restaurant.save();
    res.redirect("/restaurants"); // or json response
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating restaurant");
  }
};
