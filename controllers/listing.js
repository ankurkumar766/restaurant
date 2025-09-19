// controllers/listingController.js
const Listing = require("../models/listing");

module.exports.createListing = async (req, res) => {
  try {
    // Accept both formats: req.body.listing.[field] or plain req.body
    const data = req.body.listing || req.body;
    const listing = new Listing(data);

    if (req.file && req.file.path) {
      // multer-storage-cloudinary sets req.file.path to the uploaded image URL
      listing.image = req.file.path;
    }

    await listing.save();
    // change redirect/response as per your app
    res.redirect(`/listings/${listing._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

module.exports.updateListing = async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body.listing || req.body;

    const listing = await Listing.findById(id);
    if (!listing) return res.status(404).send("Listing not found");

    // update fields
    Object.assign(listing, data);

    if (req.file && req.file.path) {
      // optionally: delete old image from Cloudinary (not shown here)
      listing.image = req.file.path;
    }

    await listing.save();
    res.redirect(`/listings/${listing._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};
