utils/multer.js
const multer = require("multer");
const { storage } = require("./cloudinary"); // relative to utils/

const upload = multer({ storage });

module.exports = upload;
