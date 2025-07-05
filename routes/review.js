const express = require("express");

const router = express.Router({ mergeParams : true});

const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const catchAsync = require("../utils/catchAsync");
const { isLoggedIn, validateReview, isAuthor } = require("../utils/middleware.js");




//  reviews

router.post("/",isLoggedIn, validateReview, catchAsync(async(req,res)=>{
  const {id} = req.params;
  let listing = await Listing.findById(id);
  const newReview = new Review(req.body.review);

  newReview.author = req.user._id;
  listing.reviews.push(newReview);

  await newReview.save();
  await listing.save();
  req.flash("success", "Review added successfully.");
  res.redirect(`/listings/${id}`);
}));

//  delete review
router.delete("/:reviewId", isLoggedIn, isAuthor, catchAsync(async(req,res)=>{
  let {id, reviewId} = req.params;

  await Listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
  await Review.findByIdAndDelete(reviewId);

  req.flash("success", "Review deleted successfully.");
  res.redirect(`/listings/${id}`);
}));

module.exports = router;