import express from "express";
import { 
  createDonation, 
  getCampaignDonations, 
  commitDonation, 
  commitGuestDonation, 
  getCommittedPayments,
  getAllDonationsAdmin,
  getDonationStats,
  updateDonationStatus,
  flagDonation,
  getDonationDetails
} from "../controllers/doantionController.js";
import {
  createPaymentOrder,
  verifyPayment,
  getDonorDonations,
  getDonationStatus,
} from "../controllers/paymentController.js";
import { donorAuth } from "../middlewares/donorAuth.js";
import { adminAuth } from "../middlewares/adminAuth.js";

const router = express.Router();

// Legacy route (for backward compatibility)
router.post("/create", createDonation);

// Guest donation route (NO AUTHENTICATION REQUIRED)
router.post("/commit-guest", commitGuestDonation);

// Authenticated donation route (optional - for future use)
router.post("/commit", donorAuth, commitDonation);

// New payment gateway routes (for donors) - DISABLED FOR NOW
// router.post("/create-order", donorAuth, createPaymentOrder);
// router.post("/verify", donorAuth, verifyPayment);
router.get("/status/:donationId", donorAuth, getDonationStatus);
router.get("/my-donations", donorAuth, getDonorDonations);

// Public route - view donations for a campaign
router.get("/campaign/:campaignId", getCampaignDonations);

// Admin routes - Comprehensive donation management
router.get("/admin/all", adminAuth, getAllDonationsAdmin);
router.get("/admin/stats", adminAuth, getDonationStats);
router.get("/admin/committed", adminAuth, getCommittedPayments); // Legacy
router.get("/admin/:donationId", adminAuth, getDonationDetails);
router.put("/admin/:donationId/status", adminAuth, updateDonationStatus);
router.post("/admin/:donationId/flag", adminAuth, flagDonation);

export default router;
