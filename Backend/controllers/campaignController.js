// controllers/campaignController.js
import Campaign from "../models/Campaign.js";

/* =====================================================
   ADMIN: GET ALL CAMPAIGNS
===================================================== */
export const adminGetAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      campaigns
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================================
   PUBLIC: GET ONLY APPROVED CAMPAIGNS (Homepage)
===================================================== */
export const getApprovedCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ status: "approved" })
      .sort({ createdAt: -1 });

    res.json({ success: true, campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================================
   PUBLIC: GET ALL CAMPAIGNS
===================================================== */
export const getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.json({ success: true, campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================================
   PUBLIC: SINGLE CAMPAIGN
===================================================== */
export const getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found"
      });
    }

    res.json({ success: true, campaign });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================================
   USER'S OWN CAMPAIGNS (Clerk user)
===================================================== */
export const getMyCampaigns = async (req, res) => {
  try {
    const userId = req.auth.userId;

    const campaigns = await Campaign.find({
      $or: [
        { owner: userId },
        { createdBy: userId }
      ]
    }).sort({ createdAt: -1 });

    res.json({ success: true, campaigns });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================================
   CREATE CAMPAIGN
===================================================== */
export const createCampaign = async (req, res) => {
  try {
    const userId = req.auth.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

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
      educationQualification,
      employmentStatus,
      duration
    } = req.body;

    const image = req.files?.image?.length
      ? req.files.image[0].path
      : null;

    const documents = req.files?.documents?.map((doc) => doc.path) || [];

    const campaign = await Campaign.create({
      title,
      shortDescription,
      fullStory,
      goalAmount,
      category,
      beneficiaryName,
      city,
      relation,
      zakatEligible: zakatEligible === "true" || zakatEligible === true,
      educationQualification,
      employmentStatus,
      duration,
      image,
      documents,
      owner: userId,
      status: "pending",
      isApproved: false
    });

    res.json({ success: true, campaign });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

