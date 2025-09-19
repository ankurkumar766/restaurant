const express = require("express");
const router = express.Router();
const multer = require("multer");
const { storage } = require("../utils/cloudinary");
const upload = multer({ storage });
const listingController = require("../controllers/listingController");

// Create
router.post("/", upload.single("image"), listingController.createListing);

// Update
router.put("/:id", upload.single("image"), listingController.updateListing);

module.exports = router;
