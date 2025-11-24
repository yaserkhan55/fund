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

export default router;
