// Backend/controllers/campaignController.js
import Campaign from "../models/Campaign.js";

/**
 * CREATE CAMPAIGN
 */
/**
 * CREATE CAMPAIGN (CLOUDINARY VERSION)
 */
export const createCampaign = async (req, res) => {
  try {
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

    if (!title || !shortDescription || !fullStory || !goalAmount || !category) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // 🌥 CLOUDINARY IMAGE (No more localhost/uploads)
    let imageUrl = null;

    if (req.files?.image?.length > 0) {
      imageUrl = req.files.image[0].path; // secure_url from Cloudinary
    }

    // 🌥 CLOUDINARY DOCUMENTS
    const documents = req.files?.documents
      ? req.files.documents.map((doc) => doc.path) // secure_url
      : [];

    const newCampaign = new Campaign({
      title,
      shortDescription,
      fullStory,
      goalAmount: Number(goalAmount),
      category,
      beneficiaryName,
      city,
      relation,
      zakatEligible: zakatEligible === "true" || zakatEligible === true,
      image: imageUrl || "",
      documents,
      createdBy: req.user._id,
      isApproved: false,
    });

    await newCampaign.save();

    return res.status(201).json({ success: true, data: newCampaign.toObject({ virtuals: true }) });
  } catch (error) {
    console.error("🔥 createCampaign error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

/**
 * GET ALL CAMPAIGNS
 * - Supports ?approved=true query (also handles string booleans)
 * - Returns consistent shape: { success: true, data: [...] }
 */
export const getAllCampaigns = async (req, res) => {
  try {
    console.log("📥 Incoming GET /api/campaigns, query:", req.query);

    const { approved } = req.query;
    let filter = {};

    if (approved !== undefined) {
      // Accept approved=true (string) or boolean true
      if (approved === "true" || approved === true) {
        filter.$or = [{ isApproved: true }, { isApproved: "true" }];
      } else if (approved === "false" || approved === false) {
        filter.$or = [{ isApproved: false }, { isApproved: "false" }];
      }
    } else {
      // default behavior: return approved only (to match public site)
      filter.$or = [{ isApproved: true }, { isApproved: "true" }];
    }

    const campaigns = await Campaign.find(filter).sort({ createdAt: -1 }).lean({ virtuals: true });

    console.log("📤 Campaigns loaded:", campaigns.length);
    return res.json({ success: true, data: campaigns });
  } catch (error) {
    console.error("🔥 getAllCampaigns error:", error);
    return res.status(500).json({ success: false, message: "Failed to load campaigns", error: error.message });
  }
};

/**
 * GET Approved campaigns (explicit)
 */
export const getApprovedCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({
      $or: [{ isApproved: true }, { isApproved: "true" }],
    })
      .sort({ createdAt: -1 })
      .lean({ virtuals: true });

    return res.json({ success: true, data: campaigns });
  } catch (error) {
    console.error("🔥 getApprovedCampaigns error:", error);
    return res.status(500).json({ success: false, message: "Failed to load approved campaigns", error: error.message });
  }
};

/**
 * GET My campaigns (auth required)
 */
export const getMyCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .lean({ virtuals: true });

    return res.json({ success: true, data: campaigns });
  } catch (error) {
    console.error("🔥 getMyCampaigns error:", error);
    return res.status(500).json({ success: false, message: "Failed to load your campaigns", error: error.message });
  }
};

/**
 * GET single campaign by id
 */
export const getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).lean({ virtuals: true });
    if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });
    return res.json({ success: true, data: campaign });
  } catch (error) {
    console.error("🔥 getCampaignById error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch campaign", error: error.message });
  }
};
