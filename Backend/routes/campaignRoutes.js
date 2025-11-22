import express from "express";
import upload from "../middlewares/upload.js";
import { protect } from "../middlewares/auth.js";

import {
  createCampaign,
  getAllCampaigns,
  getCampaignById,
  getApprovedCampaigns,
  getMyCampaigns,
} from "../controllers/campaignController.js";

const router = express.Router();

// 1️⃣ Fixed — Put specific routes FIRST
router.get("/approved", getApprovedCampaigns);
router.get("/my", protect, getMyCampaigns);

// 2️⃣ Then list campaigns
router.get("/", getAllCampaigns);

// 3️⃣ LAST — single campaign
router.get("/:id", getCampaignById);

// CREATE (Cloudinary)
router.post(
  "/create",
  protect,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "documents", maxCount: 10 },
  ]),
  createCampaign
);

export default router;
