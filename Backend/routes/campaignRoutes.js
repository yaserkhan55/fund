import express from "express";
import upload from "../middlewares/upload.js";

// Use Clerk requireAuth
import { requireAuth } from "@clerk/express";

import {
  createCampaign,
  getAllCampaigns,
  getCampaignById,
  getApprovedCampaigns,
  getMyCampaigns,
} from "../controllers/campaignController.js";

const router = express.Router();

/* PUBLIC ROUTE — Homepage needs this */
router.get("/approved", getApprovedCampaigns);

/* MUST be Clerk-protected */
router.get("/my", requireAuth(), getMyCampaigns);

/* PUBLIC: browse all (will default to approved behavior) */
router.get("/", getAllCampaigns);

/* PUBLIC: single details */
router.get("/:id", getCampaignById);

/* CREATE — Clerk protected */
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
