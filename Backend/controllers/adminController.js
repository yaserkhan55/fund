// controllers/adminController.js
import User from "../models/User.js";
import Campaign from "../models/Campaign.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

/* --------------------------
   ADMIN LOGIN
--------------------------- */
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

/* --------------------------
   CAMPAIGNS
--------------------------- */

export const getPendingCampaigns = async (req, res) => {
  try {
    const pending = await Campaign.find({ status: "pending" })
      .sort({ createdAt: -1 });

    res.json(pending); // <-- FIXED
  } catch (err) {
    console.error("Error loading pending:", err);
    res.status(500).json({ message: "Failed to load pending" });
  }
};



export const getApprovedCampaignsAdmin = async (req, res) => {
  try {
    const approved = await Campaign.find({ status: "approved" }).sort({
      createdAt: -1,
    });

    res.json(approved);
  } catch (err) {
    res.status(500).json({ message: "Failed to load approved" });
  }
};

export const getRejectedCampaignsAdmin = async (req, res) => {
  try {
    const rejected = await Campaign.find({ status: "rejected" }).sort({
      createdAt: -1,
    });

    res.json(rejected);
  } catch (err) {
    res.status(500).json({ message: "Failed to load rejected" });
  }
};

/* --------------------------
   ACTIONS
--------------------------- */
// Approve campaign
export const getApprovedCampaigns = async (req, res) => {
  try {
    const approved = await Campaign.find({ status: "approved" })
      .sort({ createdAt: -1 });

    res.json({ campaigns: approved }); // <-- FIXED
  } catch (error) {
    res.status(500).json({ message: "Failed to load approved campaigns" });
  }
};


export const rejectCampaign = async (req, res) => {
  try {
    const id = req.params.id;

    const updated = await Campaign.findByIdAndUpdate(
      id,
      { status: "rejected", isApproved: false },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Campaign not found" });

    res.json({ message: "Campaign rejected", campaign: updated });
  } catch (error) {
    res.status(500).json({ message: "Rejection failed", error: error.message });
  }
};
export const approveCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Campaign.findByIdAndUpdate(
      id,
      { status: "approved" },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    res.json({ success: true, campaign: updated });
  } catch (error) {
    res.status(500).json({ message: "Error approving campaign" });
  }
};


export const editCampaign = async (req, res) => {
  try {
    const updated = await Campaign.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Edit failed" });
  }
};
export const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Campaign.findByIdAndDelete(id);

    if (!deleted) return res.status(404).json({ message: "Campaign not found" });

    res.json({ message: "Campaign deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
