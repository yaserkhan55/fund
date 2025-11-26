import express from "express";
import upload from "../middlewares/upload.js";

// Clerk
import { requireAuth } from "@clerk/express";
import { syncClerkUser } from "../middlewares/syncClerkUser.js";

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

/* ===========================================================
   ⭐ NEW — KETTO STYLE CAMPAIGN DETAILS MUST COME FIRST
   =========================================================== */

// Full detailed campaign page
router.get("/details/:id", getCampaignDetails);

// Suggested campaigns
router.get("/details/:id/suggested", getSuggestedCampaigns);

// Recent donors
router.get("/details/:id/donors", getRecentDonors);

// Upload gallery images
router.post(
  "/details/:id/gallery",
  requireAuth(),
  syncClerkUser,
  upload.array("images", 10),
  uploadGalleryImages
);

// Upload medical documents
router.post(
  "/details/:id/documents",
  requireAuth(),
  syncClerkUser,
  upload.array("documents", 10),
  uploadMedicalDocs
);

// Update About Section
router.put("/details/:id/about", requireAuth(), syncClerkUser, updateAboutSection);

/* ===========================
   PUBLIC — Homepage campaigns
=========================== */
router.get("/approved", getApprovedCampaigns);

/* ===========================
   USER’S OWN CAMPAIGNS
=========================== */
router.get("/my", requireAuth(), syncClerkUser, getMyCampaigns);

/* ===========================
   PUBLIC — All campaigns
=========================== */
router.get("/", getAllCampaigns);

router.get("/admin/all-campaigns", adminGetAllCampaigns);

/* ===========================
   PUBLIC — Single campaign
   MUST BE LAST!!
=========================== */
router.get("/:id", getCampaignById);

/* ===========================
   CREATE CAMPAIGN
=========================== */
const uploadMiddleware = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "documents", maxCount: 10 },
]);

router.post(
  "/create",
  requireAuth(),
  syncClerkUser,
  (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        console.error("❌ File upload error:", err);
        return res.status(400).json({
          success: false,
          message: `File upload failed: ${err.message || "Unknown error"}`
        });
      }
      // Log file upload info for debugging
      console.log("📤 File upload middleware completed");
      console.log("Files received:", {
        hasFiles: !!req.files,
        image: req.files?.image?.length || 0,
        documents: req.files?.documents?.length || 0
      });
      next();
    });
  },
  createCampaign
);

export default router;
