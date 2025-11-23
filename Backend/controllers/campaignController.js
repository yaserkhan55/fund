// controllers/campaignController.js
import Campaign from "../models/Campaign.js";
import User from "../models/User.js";

/* ------------------------------------------------------------------
   GET ALL CAMPAIGNS (Public)
------------------------------------------------------------------ */
export const getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.json({ success: true, campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ------------------------------------------------------------------
   GET SINGLE CAMPAIGN (Public)
------------------------------------------------------------------ */
export const getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign)
      return res.status(404).json({ success: false, message: "Campaign not found" });

    res.json({ success: true, campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ------------------------------------------------------------------
   CREATE CAMPAIGN (Clerk protected)
------------------------------------------------------------------ */
export const createCampaign = async (req, res) => {
  try {
    const userId = req.auth.userId; // Clerk user ID

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { title, description, goal } = req.body;

    const newCampaign = await Campaign.create({
      title,
      description,
      goal,
      owner: userId,
    });

    res.json({ success: true, campaign: newCampaign });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ------------------------------------------------------------------
   UPDATE CAMPAIGN (Clerk protected)
------------------------------------------------------------------ */
export const updateCampaign = async (req, res) => {
  try {
    const userId = req.auth.userId;

    const campaign = await Campaign.findById(req.params.id);

    if (!campaign)
      return res.status(404).json({ success: false, message: "Campaign not found" });

    if (campaign.owner !== userId)
      return res.status(403).json({ success: false, message: "Unauthorized" });

    const updated = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true });

    res.json({ success: true, campaign: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ------------------------------------------------------------------
   DELETE CAMPAIGN (Clerk protected)
------------------------------------------------------------------ */
export const deleteCampaign = async (req, res) => {
  try {
    const userId = req.auth.userId;

    const campaign = await Campaign.findById(req.params.id);

    if (!campaign)
      return res.status(404).json({ success: false, message: "Campaign not found" });

    if (campaign.owner !== userId)
      return res.status(403).json({ success: false, message: "Unauthorized" });

    await campaign.deleteOne();

    res.json({ success: true, message: "Campaign deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
