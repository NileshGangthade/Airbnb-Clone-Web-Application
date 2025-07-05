const express = require("express");
const router = express.Router({ mergeParams : true});
const User = require("../models/user.js");
const catchAsync = require("../utils/catchAsync");
const ExpressError = require("../utils/ExpressError");
const { userSchema } = require("../utils/scheme.js");
const passport = require("passport");
const {savRreDirectUrl} = require("../utils/middleware.js");


//  schema validation
const validateUser = (req, res, next) => {
  const { error } = userSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(", ");
    throw new ExpressError(msg, 400);
  }
  next();
};

router.get("/signup",(req,res)=>{
     res.render("users/signup.ejs");
});

router.post("/signup", validateUser, catchAsync(async (req, res, next) => {
    try {
      const { username, email, password } = req.body;
      const newUser = new User({ username, email });

      const registeredUser = await User.register(newUser, password); // passport-local-mongoose

     // Auto-login the user after signup
      req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash("success", "Welcome to WanderLust.");
      return res.redirect("/listings");
    });
    }catch (e) {
      if (e.name === "UserExistsError") {
        // passport-local-mongoose built-in error
        req.flash("error", "Username already taken.");
      } else if (e.code === 11000) {
        // Duplicate key error for email
        req.flash("error", "Email already registered.");
      } else {
        req.flash("error", e.message);
      }
      res.redirect("/signup");
    }
  })
);

router.get("/login", (req,res)=>{
     res.render("users/login.ejs");
});

router.post("/login", savRreDirectUrl, passport.authenticate("local", {failureFlash: true, failureRedirect: "/login"}), async(req, res) => {
  const redirectUrl = res.locals.redirectUrl || "/listings";
  delete req.session.returnTo;
  req.flash("success", "Welcome back!");
  res.redirect(redirectUrl);
});

// logout
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "Logged out successfully.");
    res.redirect("/listings");
  });
});
module.exports = router;