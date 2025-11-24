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
    if (!admin) return res.status(400).json({ message: "Admin not found" });

    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Login error", error: err.message });
  }
};

/* ---------------------------------------------------
   GET CAMPAIGNS (Pending / Approved / Rejected)
---------------------------------------------------- */

// ✅ Get Pending Campaigns
export const getPendingCampaigns = async (req, res) => {
  try {
    const pending = await Campaign.find({ status: "pending" })
      .sort({ createdAt: -1 });

    return res.json({ campaigns: pending });
  } catch (err) {
    console.error("Error loading pending:", err);
    return res.status(500).json({ message: "Failed to load pending" });
  }
};

// ✅ Get Approved
export const getApprovedCampaignsAdmin = async (req, res) => {
  try {
    const approved = await Campaign.find({ status: "approved" })
      .sort({ approvedAt: -1 });

    return res.json({ campaigns: approved });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load approved" });
  }
};

// ✅ Get Rejected
export const getRejectedCampaignsAdmin = async (req, res) => {
  try {
    const rejected = await Campaign.find({ status: "rejected" })
      .sort({ createdAt: -1 });

    return res.json({ campaigns: rejected });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load rejected" });
  }
};

/* ---------------------------------------------------
   ACTIONS: Approve / Reject / Edit / Delete
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
      return res.status(404).json({ message: "Campaign not found" });
    }

    return res.json({ message: "Campaign approved", campaign: updated });
  } catch (error) {
    return res.status(500).json({ message: "Error approving campaign" });
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
      return res.status(404).json({ message: "Campaign not found" });
    }

    return res.json({ message: "Campaign rejected", campaign: updated });
  } catch (error) {
    return res.status(500).json({ message: "Rejection failed" });
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

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: "Edit failed" });
  }
};

// ✅ DELETE CAMPAIGN
export const deleteCampaign = async (req, res) => {
  try {
    const deleted = await Campaign.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    return res.json({ message: "Campaign deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};
