// controllers/adminController.js

import User from "../models/User.js";
import Campaign from "../models/Campaign.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

/* ---------------------------------------------------
   ADMIN LOGIN
---------------------------------------------------- */
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await User.findOne({ email, role: "admin" });
    if (!admin) return res.status(400).json({ success: false, message: "Admin not found" });

    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(400).json({ success: false, message: "Invalid password" });

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ success: true, token });

  } catch (err) {
    res.status(500).json({ success: false, message: "Login error", error: err.message });
  }
};

/* ---------------------------------------------------
   CAMPAIGN LISTS (P/A/R)
---------------------------------------------------- */

// ✅ PENDING CAMPAIGNS
export const getPendingCampaigns = async (req, res) => {
  try {
    const pending = await Campaign.find({
      $or: [
        { status: "pending" },
        {
          status: { $exists: false },
          $or: [{ isApproved: { $exists: false } }, { isApproved: false }],
        },
      ],
    }).sort({ createdAt: -1 });

    return res.json({ success: true, campaigns: pending });

  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to load pending" });
  }
};

// ✅ APPROVED CAMPAIGNS
export const getApprovedCampaignsAdmin = async (req, res) => {
  try {
    const approved = await Campaign.find({
      $or: [
        { status: "approved" },
        { status: { $exists: false }, isApproved: true },
      ],
    }).sort({ approvedAt: -1, createdAt: -1 });

    return res.json({ success: true, campaigns: approved });

  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to load approved" });
  }
};

// ✅ REJECTED CAMPAIGNS
export const getRejectedCampaignsAdmin = async (req, res) => {
  try {
    const rejected = await Campaign.find({
      $or: [{ status: "rejected" }],
    }).sort({ createdAt: -1 });

    return res.json({ success: true, campaigns: rejected });

  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to load rejected" });
  }
};

/* ---------------------------------------------------
   ACTIONS: APPROVE / REJECT / EDIT / DELETE
---------------------------------------------------- */

// ✅ APPROVE CAMPAIGN
export const approveCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Campaign.findByIdAndUpdate(
      id,
      {
        status: "approved",
        isApproved: true,
        approvedAt: new Date()
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    return res.json({
      success: true,
      message: "Campaign approved",
      campaign: updated
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Error approving campaign" });
  }
};

// ✅ REJECT CAMPAIGN
export const rejectCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Campaign.findByIdAndUpdate(
      id,
      {
        status: "rejected",
        isApproved: false
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    return res.json({
      success: true,
      message: "Campaign rejected",
      campaign: updated
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Rejection failed" });
  }
};

// ✅ EDIT CAMPAIGN
export const editCampaign = async (req, res) => {
  try {
    const updated = await Campaign.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    return res.json({ success: true, campaign: updated });

  } catch (err) {
    return res.status(500).json({ success: false, message: "Edit failed" });
  }
};

// ✅ DELETE CAMPAIGN
export const deleteCampaign = async (req, res) => {
  try {
    const deleted = await Campaign.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    return res.json({ success: true, message: "Campaign deleted successfully" });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
