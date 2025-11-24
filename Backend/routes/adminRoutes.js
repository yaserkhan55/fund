import express from "express";
import {
  adminLogin,
  getPendingCampaigns,
  getApprovedCampaignsAdmin,
  getRejectedCampaignsAdmin,
  approveCampaign,
  rejectCampaign,
  editCampaign,
  deleteCampaign
} from "../controllers/adminController.js";

import { adminAuth } from "../middlewares/adminAuth.js";

const router = express.Router();

router.post("/login", adminLogin);

// Lists
router.get("/pending-campaigns", adminAuth, getPendingCampaigns);
router.get("/approved-campaigns", adminAuth, getApprovedCampaignsAdmin);
router.get("/rejected-campaigns", adminAuth, getRejectedCampaignsAdmin);

// Actions
router.put("/approve/:id", adminAuth, approveCampaign);
router.put("/reject/:id", adminAuth, rejectCampaign);
router.put("/edit/:id", adminAuth, editCampaign);
router.delete("/delete/:id", adminAuth, deleteCampaign);


export default router;
