import express from "express";
import {
  adminLogin,
  getPendingCampaigns,
  approveCampaign,
  rejectCampaign,
  getApprovedCampaignsAdmin,
  editCampaign,
} from "../controllers/adminController.js";

import { adminAuth } from "../middlewares/adminAuth.js";

const router = express.Router();

// AUTH
router.post("/login", adminLogin);

// ADMIN OPERATIONS
router.get("/pending-campaigns", adminAuth, getPendingCampaigns);
router.get("/approved-campaigns", adminAuth, getApprovedCampaignsAdmin);

router.put("/approve/:id", adminAuth, approveCampaign);
router.put("/reject/:id", adminAuth, rejectCampaign);

router.put("/edit/:id", adminAuth, editCampaign);

export default router;
