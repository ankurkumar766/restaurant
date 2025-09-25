const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const restaurantsController = require("../controllers/restaurantsController");

// Create restaurant route
router.post("/new", upload.single("image"), restaurantsController.createRestaurant);

module.exports = router;
