import express from "express";
import { createDonation, getCampaignDonations } from "../controllers/doantionController.js";

const router = express.Router();

router.post("/create", createDonation);

// (optional) view donations for a campaign
router.get("/:campaignId", getCampaignDonations);

export default router;
