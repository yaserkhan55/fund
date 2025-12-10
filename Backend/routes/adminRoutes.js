import express from "express";
import {
  adminLogin,
  getPendingCampaigns,
  approveCampaign,
  rejectCampaign,
  approveDonation,
  approveAllForCampaign
} from "../controllers/adminController.js";

import { adminAuth } from "../middlewares/adminAuth.js";

const router = express.Router();

/* -------------------------------
   ADMIN LOGIN (NO AUTH REQUIRED)
------------------------------- */
router.post("/login", adminLogin);

/* -------------------------------
   CAMPAIGNS
------------------------------- */
router.get("/pending-campaigns", adminAuth, getPendingCampaigns);
router.put("/approve/:id", adminAuth, approveCampaign);
router.put("/reject/:id", adminAuth, rejectCampaign);

/* -------------------------------
   DONATIONS
------------------------------- */
router.put("/donations/approve/:id", adminAuth, approveDonation);

/* -------------------------------
   APPROVE ALL (CAMPAIGN + DONATIONS + SMS)
------------------------------- */
router.put("/approve-all/:campaignId", adminAuth, approveAllForCampaign);

export default router;
