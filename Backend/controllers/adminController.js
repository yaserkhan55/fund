// controllers/adminController.js
import User from "../models/User.js";
import Campaign from "../models/Campaign.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/* ================================
   ADMIN LOGIN
================================ */
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await User.findOne({ email, role: "admin" });

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    const match = await bcrypt.compare(password, admin.password);

    if (!match) {
      return res.status(400).json({ success: false, message: "Incorrect password" });
    }

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ success: true, message: "Logged in", token });

  } catch (err) {
    console.error("adminLogin error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


/* ================================
   GET ALL PENDING CAMPAIGNS
================================ */
export const getPendingCampaigns = async (req, res) => {
  try {
    const pending = await Campaign.find({ status: "pending" }).sort({
      createdAt: -1,
    });

    res.json(pending);

  } catch (error) {
    console.error("getPendingCampaigns error:", error);
    res.status(500).json({ message: "Failed to load pending campaigns" });
  }
};


/* ================================
   GET APPROVED CAMPAIGNS (ADMIN VIEW)
================================ */
export const getApprovedCampaignsAdmin = async (req, res) => {
  try {
    const approved = await Campaign.find({ status: "approved" }).sort({
      createdAt: -1,
    });

    res.json(approved);

  } catch (error) {
    console.error("getApprovedCampaignsAdmin error:", error);
    res.status(500).json({ message: "Failed to load approved campaigns" });
  }
};


/* ================================
   APPROVE CAMPAIGN
================================ */
export const approveCampaign = async (req, res) => {
  try {
    const id = req.params.id;

    const updated = await Campaign.findByIdAndUpdate(
      id,
      { status: "approved" },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    return res.json({
      success: true,
      message: "Campaign approved",
      data: updated,
    });

  } catch (err) {
    console.error("approveCampaign error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


/* ================================
   REJECT CAMPAIGN
================================ */
export const rejectCampaign = async (req, res) => {
  try {
    const id = req.params.id;

    const updated = await Campaign.findByIdAndUpdate(
      id,
      { status: "rejected" },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    return res.json({
      success: true,
      message: "Campaign rejected",
    });

  } catch (err) {
    console.error("rejectCampaign error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


/* ================================
   EDIT CAMPAIGN
================================ */
export const editCampaign = async (req, res) => {
  try {
    const id = req.params.id;

    const updated = await Campaign.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    return res.json({
      success: true,
      message: "Campaign updated successfully",
      data: updated,
    });

  } catch (err) {
    console.error("editCampaign error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
