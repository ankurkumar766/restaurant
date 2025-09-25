const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const restaurantsController = require("../controllers/restaurantsController");

// Create restaurant
router.post("/new", upload.single("image"), restaurantsController.createRestaurant);

// Update restaurant
router.post("/edit/:id", upload.single("image"), restaurantsController.updateRestaurant);

module.exports = router;
