import express from "express";
import {
  adminLogin,
  getPendingCampaigns,
  approveCampaign,
  rejectCampaign,
} from "../controllers/adminController.js";

import { adminAuth } from "../middlewares/adminAuth.js";

const router = express.Router();

// AUTH
router.post("/login", adminLogin);

// ONLY ADMIN
router.get("/pending-campaigns", adminAuth, getPendingCampaigns);
router.put("/approve/:id", adminAuth, approveCampaign);
router.delete("/reject/:id", adminAuth, rejectCampaign);

export default router;
