import Campaign from "../models/Campaign.js";

/* --------------------------------------------------------------
   PUBLIC — GET APPROVED CAMPAIGNS (Homepage)
-------------------------------------------------------------- */
export const getApprovedCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ status: "approved" })
      .sort({ createdAt: -1 });

    res.json({ success: true, campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* --------------------------------------------------------------
   PUBLIC — GET ALL CAMPAIGNS (fallback)
-------------------------------------------------------------- */
export const getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.json({ success: true, campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* --------------------------------------------------------------
   PUBLIC — GET SINGLE CAMPAIGN
-------------------------------------------------------------- */
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

/* --------------------------------------------------------------
   USER — GET MY CAMPAIGNS (Clerk)
-------------------------------------------------------------- */
export const getMyCampaigns = async (req, res) => {
  try {
    const userId = req.auth.userId;

    const campaigns = await Campaign.find({ owner: userId }).sort({
      createdAt: -1,
    });

    res.json({ success: true, campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* --------------------------------------------------------------
   CREATE CAMPAIGN (Clerk + File Upload)
-------------------------------------------------------------- */
export const createCampaign = async (req, res) => {
  try {
    const userId = req.auth.userId;

    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const {
      title,
      shortDescription,
      fullStory,
      goalAmount,
      category,
      beneficiaryName,
      city,
      relation,
      zakatEligible,
    } = req.body;

    const image = req.files?.image ? req.files.image[0].path : null;
    const documents = req.files?.documents
      ? req.files.documents.map((d) => d.path)
      : [];

    const campaign = await Campaign.create({
      title,
      shortDescription,
      fullStory,
      goalAmount,
      category,
      beneficiaryName,
      city,
      relation,
      zakatEligible,
      image,
      documents,
      owner: userId,
      status: "pending", // ⭐ Default so admin can approve it
    });

    res.json({ success: true, campaign });
  } catch (error) {
    console.error("Create Campaign Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* --------------------------------------------------------------
   UPDATE CAMPAIGN — OPTIONAL
-------------------------------------------------------------- */
export const updateCampaign = async (req, res) => {
  try {
    const userId = req.auth.userId;

    const campaign = await Campaign.findById(req.params.id);

    if (!campaign)
      return res.status(404).json({ success: false, message: "Campaign not found" });

    if (campaign.owner !== userId)
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized" });

    const updated = await Campaign.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.json({ success: true, campaign: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* --------------------------------------------------------------
   DELETE CAMPAIGN — OPTIONAL
-------------------------------------------------------------- */
export const deleteCampaign = async (req, res) => {
  try {
    const userId = req.auth.userId;

    const campaign = await Campaign.findById(req.params.id);

    if (!campaign)
      return res.status(404).json({ success: false, message: "Campaign not found" });

    if (campaign.owner !== userId)
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized" });

    await campaign.deleteOne();

    res.json({ success: true, message: "Campaign deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
