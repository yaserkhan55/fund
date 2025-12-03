import express from "express";
import Donation from "../models/Donation.js";
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

// Public route - check for approved donations by email (for showing thanks popup)
router.get("/check-approved/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const donations = await Donation.find({
      donorEmail: email.toLowerCase(),
      paymentStatus: "success",
      paymentReceived: true,
      paymentReceivedAt: { $gte: sevenDaysAgo },
    })
      .populate("campaignId", "title")
      .sort({ paymentReceivedAt: -1 })
      .limit(10)
      .lean();
    
    return res.json({
      success: true,
      donations,
    });
  } catch (err) {
    console.error("Check Approved Donations Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to check approved donations.",
      error: err.message,
    });
  }
});

// Admin routes - Comprehensive donation management
router.get("/admin/all", adminAuth, getAllDonationsAdmin);
router.get("/admin/stats", adminAuth, getDonationStats);
router.get("/admin/committed", adminAuth, getCommittedPayments); // Legacy
router.get("/admin/:donationId", adminAuth, getDonationDetails);
router.put("/admin/:donationId/status", adminAuth, updateDonationStatus);
router.post("/admin/:donationId/flag", adminAuth, flagDonation);

export default router;
