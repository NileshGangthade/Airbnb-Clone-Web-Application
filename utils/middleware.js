const express = require("express");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

const ExpressError = require("./ExpressError");
const {reviewSchema, listingSchema} = require("./scheme.js")
module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl;
    req.flash("error", "You must be Logged In.");
    return res.redirect("/login");
  }
  next();
};

module.exports.savRreDirectUrl = (req,res,next)=>{
  if(req.session.returnTo){
    res.locals.redirectUrl = req.session.returnTo;
  }
  next();
};
// schema validation
module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(msg, 400);
  }
  next();
};

//  schema validation
module.exports.validateListing = (req, res, next) => {
  const { error } = listingSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(", ");
    throw new ExpressError(msg, 400);
  } else {
    next();
  }
};

//  check Auth

module.exports.isOwner = async (req,res,next)=>{
  const { id } = req.params;
  let newListing = await Listing.findById(id);

  if( ! newListing.owner._id === (req.user._id)){
    req.flash("error", "You are not owner of this listing.");
   return res.redirect(`/listings/${id}`);
  }
  next();
}

//  review Auth

module.exports.isAuthor = async (req,res,next)=>{
  const {id, reviewId } = req.params;
  let review = await Review.findById(reviewId);

  if( ! review.author.equals(res.locals.currentUser._id)){
    req.flash("error", "You are not owner of this Review.");
    return res.redirect(`/listings/${id}`);
  }
  next();
}