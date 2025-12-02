import express from "express";
import { register, login, sendOtp, verifyOtp } from "../controllers/authController.js";
import { syncClerkUser } from "../controllers/clerkAuthController.js";

const router = express.Router();

/* AUTH */
router.post("/register", register);
router.post("/login", login);

/* OTP */
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

/* CLERK SYNC - Unified authentication with user type */
router.post("/clerk-sync", syncClerkUser);

export default router;
