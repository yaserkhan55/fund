import Admin from "../models/Admin.js";
import Campaign from "../models/Campaign.js";
import Donation from "../models/Donation.js";
import { sendSms } from "../utils/sendSms.js";
import jwt from "jsonwebtoken";

// =====================================
// ADMIN LOGIN
// =====================================
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    if (admin.password !== password) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({ success: true, token });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// =====================================
// GET PENDING CAMPAIGNS
// =====================================
export const getPendingCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ status: "pending" }).populate("owner");
    return res.json({ success: true, campaigns });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// =====================================
// APPROVE A SINGLE CAMPAIGN
// =====================================
export const approveCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    campaign.status = "approved";
    campaign.approvedAt = new Date();
    await campaign.save();

    return res.json({ success: true, message: "Campaign approved" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// =====================================
// REJECT SINGLE CAMPAIGN
// =====================================
export const rejectCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    campaign.status = "rejected";
    await campaign.save();

    return res.json({ success: true, message: "Campaign rejected" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// =====================================
// APPROVE SINGLE DONATION
// =====================================
export const approveDonation = async (req, res) => {
  try {
    const { id } = req.params;

    const donation = await Donation.findById(id);
    if (!donation) {
      return res.status(404).json({ success: false, message: "Donation not found" });
    }

    donation.status = "approved";
    await donation.save();

    // send sms
    const numbers = [];
    if (donation.donor?.phone) numbers.push(donation.donor.phone);
    if (donation.contact?.phone) numbers.push(donation.contact.phone);

    if (numbers.length > 0) {
      await sendSms({
        numbers,
        message: "Your donation has been approved. Thank you.",
      });
    }

    return res.json({ success: true, message: "Donation approved + SMS sent" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// =====================================
// APPROVE ALL FOR CAMPAIGN (WITH SMS)
// =====================================
export const approveAllForCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;

    // 1) approve campaign
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }
    campaign.status = "approved";
    campaign.approvedAt = new Date();
    await campaign.save();

    // 2) approve all donations
    const donations = await Donation.find({ campaign: campaignId });

    const phones = [];

    for (const donation of donations) {
      donation.status = "approved";
      await donation.save();

      if (donation.donor?.phone) phones.push(donation.donor.phone);
      if (donation.contact?.phone) phones.push(donation.contact.phone);
      if (donation.ownerPhone) phones.push(donation.ownerPhone);
    }

    const uniquePhones = [...new Set(phones)];

    // 3) sms
    if (uniquePhones.length > 0) {
      await sendSms({
        numbers: uniquePhones,
        message: "Your request has been approved successfully. Thank you.",
      });
    }

    return res.json({
      success: true,
      message: "Campaign + all donations approved. SMS sent.",
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
