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
  resolveInfoRequest,
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  getCampaignWithResponses,
  adminRespondToUserResponse,
  getCampaignsWithPendingResponses,
  getActivityLog
} from "../controllers/adminController.js";

import { adminAuth } from "../middlewares/adminAuth.js";

const router = express.Router();

/* -------------------------------
   ADMIN LOGIN (NO AUTH REQUIRED)
------------------------------- */
router.post("/login", adminLogin);

/* -------------------------------
   DASHBOARD & STATISTICS
------------------------------- */
router.get("/dashboard/stats", adminAuth, getDashboardStats);

/* -------------------------------
   ACTIVITY LOG
------------------------------- */
router.get("/activity-log", adminAuth, getActivityLog);

/* -------------------------------
   USER MANAGEMENT
------------------------------- */
router.get("/users", adminAuth, getAllUsers);
router.get("/users/:id", adminAuth, getUserDetails);

/* -------------------------------
   CAMPAIGN LISTS
------------------------------- */
router.get("/pending-campaigns", adminAuth, getPendingCampaigns);
router.get("/approved-campaigns", adminAuth, getApprovedCampaignsAdmin);
router.get("/rejected-campaigns", adminAuth, getRejectedCampaignsAdmin);
router.get("/campaigns-with-pending-responses", adminAuth, getCampaignsWithPendingResponses);

/* -------------------------------
   CAMPAIGN ACTIONS
------------------------------- */
router.put("/approve/:id", adminAuth, approveCampaign);
router.put("/reject/:id", adminAuth, rejectCampaign);
router.put("/edit/:id", adminAuth, editCampaign);
router.delete("/delete/:id", adminAuth, deleteCampaign);
router.post("/campaigns/:id/request-info", adminAuth, requestAdditionalInfo);
router.put("/campaigns/:id/info-requests/:requestId/resolve", adminAuth, resolveInfoRequest);

/* -------------------------------
   CAMPAIGN RESPONSES & INTERACTIONS
------------------------------- */
router.get("/campaigns/:id/responses", adminAuth, getCampaignWithResponses);
router.post("/campaigns/:id/info-requests/:requestId/responses/:responseId/respond", adminAuth, adminRespondToUserResponse);

export default router;
