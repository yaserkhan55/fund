// controllers/campaignController.js
import Campaign from "../models/Campaign.js";
import { notifyOwner } from "../utils/notifyOwner.js";

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
    })
    .sort({ createdAt: -1 })
    .lean(); // Use lean() for better performance and to ensure all fields are returned

    console.log(`Found ${campaigns.length} campaigns for user ${userId}`);
    
    // Log campaigns with infoRequests for debugging
    const campaignsWithRequests = campaigns.filter(c => c.infoRequests && c.infoRequests.length > 0);
    if (campaignsWithRequests.length > 0) {
      console.log(`Found ${campaignsWithRequests.length} campaigns with infoRequests`);
      campaignsWithRequests.forEach(c => {
        console.log(`Campaign ${c.title} has ${c.infoRequests.length} requests`);
      });
    }

    res.json({ success: true, campaigns });

  } catch (error) {
    console.error("Error in getMyCampaigns:", error);
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

    if (!documents.length) {
      return res.status(400).json({
        success: false,
        message: "At least one medical document is required.",
      });
    }

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
      status: "pending", // Explicitly set to pending
      isApproved: false // Explicitly set to false
    });

    console.log(`✅ New campaign created: ${campaign._id} - ${campaign.title}`);
    console.log(`   Status: ${campaign.status}, isApproved: ${campaign.isApproved}`);

    await notifyOwner({
      ownerId: userId,
      overrideName: campaign?.beneficiaryName,
    });

    res.json({ success: true, campaign });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

