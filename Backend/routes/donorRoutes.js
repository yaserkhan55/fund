import express from "express";
import {
  registerDonor,
  loginDonor,
  verifyOTP,
  resendOTP,
  getDonorProfile,
  updateDonorProfile,
  changePassword,
  googleAuth,
} from "../controllers/donorController.js";
import { donorAuth } from "../middlewares/donorAuth.js";

const router = express.Router();

// Public routes
router.post("/register", registerDonor);
router.post("/login", loginDonor);
router.post("/google-auth", googleAuth);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);

// Protected routes (require authentication)
router.get("/profile", donorAuth, getDonorProfile);
router.put("/profile", donorAuth, updateDonorProfile);
router.put("/change-password", donorAuth, changePassword);

export default router;

