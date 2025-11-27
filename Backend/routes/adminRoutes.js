// routes/adminRoutes.js

import express from "express";
import {
  adminLogin,
  getPendingCampaigns,
  getApprovedCampaignsAdmin,
  getRejectedCampaignsAdmin,
  approveCampaign,
  rejectCampaign,
  editCampaign,
  deleteCampaign,
  requestAdditionalInfo,
  resolveInfoRequest
} from "../controllers/adminController.js";

import { adminAuth } from "../middlewares/adminAuth.js";

const router = express.Router();

/* -------------------------------
   ADMIN LOGIN (NO AUTH REQUIRED)
-------------------------------- */
router.post("/login", adminLogin);

/* -------------------------------
   CAMPAIGN LISTS
-------------------------------- */
router.get("/pending-campaigns", adminAuth, getPendingCampaigns);
router.get("/approved-campaigns", adminAuth, getApprovedCampaignsAdmin);
router.get("/rejected-campaigns", adminAuth, getRejectedCampaignsAdmin);

/* -------------------------------
   CAMPAIGN ACTIONS
-------------------------------- */
router.put("/approve/:id", adminAuth, approveCampaign);
router.put("/reject/:id", adminAuth, rejectCampaign);
router.put("/edit/:id", adminAuth, editCampaign);
router.delete("/delete/:id", adminAuth, deleteCampaign);
router.post("/campaigns/:id/request-info", adminAuth, requestAdditionalInfo);
router.put("/campaigns/:id/info-requests/:requestId/resolve", adminAuth, resolveInfoRequest);

export default router;
