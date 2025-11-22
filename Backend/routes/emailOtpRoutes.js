import express from "express";
import { sendEmailOtp, verifyEmailOtp } from "../controllers/emailOtpController.js";

const router = express.Router();

// POST → Send OTP
router.post("/send-otp", sendEmailOtp);

// POST → Verify OTP
router.post("/verify-otp", verifyEmailOtp);

export default router;
