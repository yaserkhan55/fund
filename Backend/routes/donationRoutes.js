import express from "express";
import { createDonation, getCampaignDonations, commitDonation } from "../controllers/doantionController.js";
import {
  createPaymentOrder,
  verifyPayment,
  getDonorDonations,
  getDonationStatus,
} from "../controllers/paymentController.js";
import { donorAuth } from "../middlewares/donorAuth.js";

const router = express.Router();

// Legacy route (for backward compatibility)
router.post("/create", createDonation);

// Donation commitment route (without payment)
router.post("/commit", donorAuth, commitDonation);

// New payment gateway routes (for donors) - DISABLED FOR NOW
// router.post("/create-order", donorAuth, createPaymentOrder);
// router.post("/verify", donorAuth, verifyPayment);
router.get("/status/:donationId", donorAuth, getDonationStatus);
router.get("/my-donations", donorAuth, getDonorDonations);

// Public route - view donations for a campaign
router.get("/campaign/:campaignId", getCampaignDonations);

export default router;
