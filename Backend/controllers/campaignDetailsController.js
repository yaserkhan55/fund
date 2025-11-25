// Backend/controllers/campaignDetailsController.js

import Campaign from "../models/Campaign.js";
import Donation from "../models/Donation.js";

const DAY_IN_MS = 1000 * 60 * 60 * 24;

const resolveArray = (primary = [], fallback = []) => {
  if (Array.isArray(primary) && primary.length) return primary;
  if (Array.isArray(fallback) && fallback.length) return fallback;
  return [];
};

const resolveAbout = (campaign) => {
  if (campaign.about && campaign.about.trim().length) return campaign.about;
  if (campaign.aboutSection && campaign.aboutSection.trim().length) {
    return campaign.aboutSection;
  }
  return campaign.fullStory || "";
};

const computeDaysLeft = (campaign) => {
  const now = Date.now();

  if (campaign.endDate) {
    const diff = new Date(campaign.endDate).getTime() - now;
    return Math.max(0, Math.ceil(diff / DAY_IN_MS));
  }

  if (campaign.duration) {
    const created = new Date(campaign.createdAt || now).getTime();
    const end = created + campaign.duration * DAY_IN_MS;
    return Math.max(0, Math.ceil((end - now) / DAY_IN_MS));
  }

  return 0;
};

/* ==============================
   GET FULL CAMPAIGN DETAILS
   ============================== */
export const getCampaignDetails = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate("owner", "name email phone")
      .lean();

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    const [supportersCount] = await Promise.all([
      Donation.countDocuments({ campaignId: campaign._id }),
    ]);

    const normalizedImages = resolveArray(campaign.patientImages, campaign.imageGallery);
    const normalizedDocs = resolveArray(campaign.documents, campaign.medicalDocuments);

    return res.json({
      success: true,
      campaign: {
        ...campaign,
        raisedAmount: Number(campaign.raisedAmount || 0),
        about: resolveAbout(campaign),
      },
      patientImages: normalizedImages,
      documents: normalizedDocs,
      stats: {
        supporters: supportersCount,
        daysLeft: computeDaysLeft(campaign),
      },
    });
  } catch (error) {
    console.error("Get Details Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ==============================
   UPLOAD GALLERY IMAGES
   ============================== */
export const uploadGalleryImages = async (req, res) => {
  try {
    const imgs = req.files.map((f) => `/uploads/${f.filename}`);

    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          patientImages: { $each: imgs },
          imageGallery: { $each: imgs },
        },
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Images uploaded",
      images: campaign.patientImages,
    });
  } catch (error) {
    console.error("Upload Gallery Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ==============================
   UPLOAD MEDICAL DOCUMENTS
   ============================== */
export const uploadMedicalDocs = async (req, res) => {
  try {
    const docs = req.files.map((f) => `/uploads/${f.filename}`);

    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          documents: { $each: docs },
          medicalDocuments: { $each: docs },
        },
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Documents uploaded",
      documents: campaign.documents,
    });
  } catch (error) {
    console.error("Upload Docs Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ==============================
   UPDATE ABOUT SECTION
   ============================== */
export const updateAboutSection = async (req, res) => {
  try {
    const { about } = req.body;

    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { about, aboutSection: about },
      { new: true }
    );

    res.json({
      success: true,
      message: "About section updated",
      about: campaign.about,
    });
  } catch (error) {
    console.error("Update About Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ==============================
   SUGGESTED CAMPAIGNS
   ============================== */
export const getSuggestedCampaigns = async (req, res) => {
  try {
    const current = await Campaign.findById(req.params.id);
    if (!current) {
      return res.json({ success: true, campaigns: [] });
    }

    const filter = {
      _id: { $ne: current._id },
      status: "approved",
    };

    if (current.category) {
      filter.category = current.category;
    }

    const campaigns = await Campaign.find(filter).sort({ createdAt: -1 }).limit(4);

    res.json({
      success: true,
      campaigns,
    });
  } catch (error) {
    console.error("Suggested Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ==============================
   RECENT DONORS (STATIC FOR NOW)
   ============================== */
export const getRecentDonors = async (req, res) => {
  try {
    const donors = await Donation.find({ campaignId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    res.json({
      success: true,
      donors,
    });
  } catch (error) {
    console.error("Donors Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
