// Backend/controllers/campaignDetailsController.js

import Campaign from "../models/Campaign.js";

/* ==============================
   GET FULL CAMPAIGN DETAILS
   ============================== */
export const getCampaignDetails = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    return res.json({
      success: true,
      campaign,
      patientImages: campaign.patientImages || [],
      documents: campaign.documents || [],
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
      { $push: { patientImages: { $each: imgs } } },
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
      { $push: { documents: { $each: docs } } },
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
      { about },
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
    const campaigns = await Campaign.find().limit(4);

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
    // You will connect real donor DB later
    res.json({
      success: true,
      donors: [],
    });
  } catch (error) {
    console.error("Donors Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
