const express = require("express");

const router = express.Router({ mergeParams : true});

const Listing = require("../models/listing.js");
const catchAsync = require("../utils/catchAsync");
const ExpressError = require("../utils/ExpressError");
const { Types } = require("mongoose");
const { isLoggedIn, validateListing, isOwner } = require("../utils/middleware.js");
const { cloudinary } = require("../cloudConfig.js");
const multer  = require('multer')
const {storage} = require("../cloudConfig.js");
const upload = multer({ storage })



// Index Route
router.get("/", catchAsync(async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
}));

// New Route
router.get("/new", isLoggedIn, (req, res) => {
  res.render("listings/new.ejs");
});

// Show Route
router.get("/:id", catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    return next(new ExpressError("Invalid listing ID", 400));
  }

  const listing = await Listing.findById(id).populate({path:"reviews", populate:{path : "author"}}).populate("owner");
  if (!listing) {
    return next(new ExpressError("Listing not found", 404));
  }

  res.render("listings/show.ejs", { listing });
}));


// Create Route
router.post("/", isLoggedIn, upload.single("listing[image]"),  validateListing,  catchAsync(async (req, res) => {
    const { listing } = req.body;

    // Safety check: if no file was uploaded
    if (!req.file) {
      req.flash("error", "Image upload failed or missing.");
      return res.redirect("/listings/new");
    }

    // Save image data
    const newListing = new Listing({...listing,
      image: {
        url: req.file.path,
        filename: req.file.filename,
      },
      owner: req.user._id,
    });

    await newListing.save();
    req.flash("success", "New Listing Created.");
    res.redirect("/listings");
  })
);
// Edit Route
router.get("/:id/edit", isLoggedIn, catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    return next(new ExpressError("Invalid listing ID", 400));
  }

  const listing = await Listing.findById(id);
  if (!listing) {
    return next(new ExpressError("Listing not found", 404));
  }

  res.render("listings/edit.ejs", { listing });
}));

// Update Route
router.put("/:id", isLoggedIn, upload.single("listing[image]"), validateListing, isOwner,  catchAsync(async (req, res, next) => {
   const { id } = req.params;

    // Validate ObjectId
    if (!Types.ObjectId.isValid(id)) {
      return next(new ExpressError("Invalid listing ID", 400));
    }

    // Find existing listing
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing not found.");
      return res.redirect("/listings");
    }

    // Update listing fields
    listing.title = req.body.listing.title;
    listing.description = req.body.listing.description;
    listing.price = req.body.listing.price;
    listing.location = req.body.listing.location;
    listing.country = req.body.listing.country;

    // Replace image if new file uploaded
    if (req.file) {
      // Delete old image from Cloudinary
      if (listing.image && listing.image.filename) {
        await cloudinary.uploader.destroy(listing.image.filename);
      }

      // Save new image info
      listing.image = {
        url: req.file.path,
        filename: req.file.filename,
      };
    }

    await listing.save();

    req.flash("success", "Listing Updated Successfully.");
    res.redirect(`/listings/${id}`);
  })
);

// Delete Route
router.delete("/:id", isLoggedIn, isOwner, catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    return next(new ExpressError("Invalid listing ID", 400));
  }
  const deletedListing = await Listing.findByIdAndDelete(id);
  if (!deletedListing) {
    return next(new ExpressError("Listing not found", 404));
  }
  req.flash("success", "Listing Deleted Successfully.");
  res.redirect("/listings");
}));


module.exports = router;