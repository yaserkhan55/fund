import express from "express";
import passport from "passport";

import {
  register,
  login,
  sendOtp,
  verifyOtp,
} from "../controllers/authController.js";

const router = express.Router();

/* AUTH */
router.post("/register", register);
router.post("/login", login);

/* GOOGLE LOGIN (REDIRECT FLOW) */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account" 
  })
);

/* GOOGLE CALLBACK */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "https://fund-liart.vercel.app/login"
  }),
  (req, res) => {
    res.redirect("https://fund-liart.vercel.app/dashboard");
  }
);

/* OTP */
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

export default router;

