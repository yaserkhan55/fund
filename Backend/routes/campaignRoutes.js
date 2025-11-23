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

/* PUBLIC ROUTE — Homepage needs this */
router.get("/approved", getApprovedCampaigns);

/* Auth required */
router.get("/my", protect, getMyCampaigns);

router.get("/", getAllCampaigns);

router.get("/:id", getCampaignById);

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
