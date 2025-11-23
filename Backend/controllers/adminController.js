// controllers/adminController.js
import User from "../models/User.js";
import Campaign from "../models/Campaign.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await User.findOne({ email, role: "admin" });
    if (!admin)
      return res.status(404).json({ success: false, message: "Admin not found" });

    const match = await bcrypt.compare(password, admin.password);
    if (!match)
      return res
        .status(400)
        .json({ success: false, message: "Incorrect password" });

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

// ✅ FIX — use NEW status system
export const getPendingCampaigns = async (req, res) => {
  try {
    const pending = await Campaign.find({ status: "pending" }).sort({
      createdAt: -1,
    });
    res.json(pending);
  } catch (error) {
    res.status(500).json({ message: "Failed to load pending campaigns" });
  }
};

// ✅ FIX — update status instead of old isApproved
export const approveCampaign = async (req, res) => {
  try {
    const id = req.params.id;
    const updated = await Campaign.findByIdAndUpdate(
      id,
      { status: "approved" },
      { new: true }
    );
    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Campaign not found" });
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

// OPTIONAL (delete or reject)
export const rejectCampaign = async (req, res) => {
  try {
    const id = req.params.id;
    const updated = await Campaign.findByIdAndUpdate(
      id,
      { status: "rejected" },
      { new: true }
    );
    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Campaign not found" });

    return res.json({
      success: true,
      message: "Campaign rejected",
    });
  } catch (err) {
    console.error("rejectCampaign error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
