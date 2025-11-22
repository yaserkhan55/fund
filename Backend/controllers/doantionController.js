import Campaign from "../models/Campaign.js";
import Donation from "../models/Donation.js";

export const createDonation = async (req, res) => {
  try {
    const { campaignId, amount, name, phone } = req.body;

    if (!campaignId || !amount || !name || !phone) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found.",
      });
    }

    // Save donation
    const donation = await Donation.create({
      campaignId,
      amount,
      name,
      phone,
    });

    // Update campaign raised amount
    campaign.raisedAmount += Number(amount);
    await campaign.save();

    return res.status(201).json({
      success: true,
      message: "Donation successful.",
      donation,
    });
  } catch (error) {
    console.error("Donation Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error.",
      error: error.message,
    });
  }
};

export const getCampaignDonations = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const donations = await Donation.find({ campaignId }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      donations,
    });
  } catch (err) {
    console.error("Fetch Donation Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error.",
      error: err.message,
    });
  }
};
