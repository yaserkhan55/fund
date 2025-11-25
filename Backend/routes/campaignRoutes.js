import express from "express";
import upload from "../middlewares/upload.js";

// Clerk
import { requireAuth } from "@clerk/express";

import {
  createCampaign,
  getAllCampaigns,
  getCampaignById,
  getApprovedCampaigns,
  getMyCampaigns,
  adminGetAllCampaigns
} from "../controllers/campaignController.js";

// NEW CONTROLLERS (Ketto-style details)
import {
  getCampaignDetails,
  uploadGalleryImages,
  uploadMedicalDocs,
  updateAboutSection,
  getSuggestedCampaigns,
  getRecentDonors
} from "../controllers/campaignDetailsController.js";

const router = express.Router();

/* ===========================
   PUBLIC — Homepage campaigns
   =========================== */
router.get("/approved", getApprovedCampaigns);

/* ===========================
   USER’S OWN CAMPAIGNS (Protected)
   =========================== */
router.get("/my", requireAuth(), getMyCampaigns);

/* ===========================
   PUBLIC — All campaigns
   =========================== */
router.get("/", getAllCampaigns);

/* ===========================
   PUBLIC — Single campaign
   =========================== */
router.get("/:id", getCampaignById);

router.get("/admin/all-campaigns", adminGetAllCampaigns);

/* ===========================
   CREATE CAMPAIGN (Protected)
   =========================== */
router.post(
  "/create",
  requireAuth(),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "documents", maxCount: 10 },
  ]),
  createCampaign
);

/* ===========================================================
   ⭐ NEW — KETTO STYLE CAMPAIGN DETAILS SYSTEM (NO CHANGES ABOVE)
   =========================================================== */

// Full detailed campaign page
router.get("/details/:id", getCampaignDetails);

// Upload gallery images
router.post(
  "/details/:id/gallery",
  requireAuth(),
  upload.array("images", 10),
  uploadGalleryImages
);

// Upload medical documents
router.post(
  "/details/:id/documents",
  requireAuth(),
  upload.array("documents", 10),
  uploadMedicalDocs
);

// Update About Section
router.put("/details/:id/about", requireAuth(), updateAboutSection);

// Suggested campaigns
router.get("/details/:id/suggested", getSuggestedCampaigns);

// Recent donors
router.get("/details/:id/donors", getRecentDonors);

export default router;
