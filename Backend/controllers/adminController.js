// controllers/adminController.js

import User from "../models/User.js";
import Campaign from "../models/Campaign.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { notifyOwner } from "../utils/notifyOwner.js";

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
    // Get ALL campaigns that are NOT approved and NOT rejected
    // This catches everything: pending, null, undefined, "", or missing status
    // Also include campaigns where isApproved is false or not set
    const pending = await Campaign.find({
      $or: [
        { status: { $exists: false } },
        { status: null },
        { status: "" },
        {
          status: {
            $not: {
              $in: ["approved", "Approved", "rejected", "Rejected"],
            },
          },
        },
      ],
    })
    .populate({
      path: "owner",
      select: "name email clerkId provider",
      options: { strictPopulate: false } // Don't fail if owner doesn't exist
    })
    .sort({ createdAt: -1 }) // Newest first
    .lean(); // Use lean for better performance

    // Convert to plain objects and ensure owner is handled properly
    const campaigns = pending.map(campaign => {
      const campaignObj = { ...campaign };
      
      // If owner is null or doesn't exist, set a default
      if (!campaignObj.owner || (typeof campaignObj.owner === 'object' && !campaignObj.owner._id)) {
        campaignObj.owner = {
          name: "Unknown User",
          email: "unknown@user.com",
          clerkId: null,
          provider: "unknown"
        };
      }
      
      // Ensure status is set
      if (!campaignObj.status) {
        campaignObj.status = "pending";
      }
      
      return campaignObj;
    });

    // Log campaign details for debugging
    if (campaigns.length > 0) {
      console.log(`📋 Found ${campaigns.length} pending campaigns:`);
      campaigns.slice(0, 10).forEach((c, idx) => {
        const ownerInfo = c.owner ? 
          (typeof c.owner === 'object' ? `${c.owner.name || 'Unknown'} (${c.owner.email || 'No email'})` : c.owner) :
          'No owner';
        console.log(`   ${idx + 1}. ${c.title}`);
        console.log(`      ID: ${c._id}`);
        console.log(`      Status: ${c.status || 'null'}, isApproved: ${c.isApproved}`);
        console.log(`      Owner: ${ownerInfo}`);
        console.log(`      Created: ${c.createdAt}`);
        console.log(`      Owner ID: ${c.owner?._id || c.owner || 'Missing'}`);
      });
    } else {
      console.log("📋 No pending campaigns found");
      
      // Debug: Check total campaigns in database
      const totalCampaigns = await Campaign.countDocuments({});
      const approvedCount = await Campaign.countDocuments({ status: "approved" });
      const rejectedCount = await Campaign.countDocuments({ status: "rejected" });
      const pendingCount = await Campaign.countDocuments({
        $or: [
          {
            $and: [
              { status: { $ne: "approved" } },
              { status: { $ne: "rejected" } }
            ]
          },
          { status: null },
          { status: { $exists: false } }
        ]
      });
      console.log(`📊 Database stats: Total=${totalCampaigns}, Approved=${approvedCount}, Rejected=${rejectedCount}, Pending=${pendingCount}`);
    }

    return res.json({ success: true, campaigns }); // Return consistent shape

  } catch (err) {
    console.error("Error fetching pending campaigns:", err);
    return res.status(500).json({ success: false, message: "Failed to load pending", error: err.message });
  }
};

// ✅ APPROVED CAMPAIGNS
export const getApprovedCampaignsAdmin = async (req, res) => {
  try {
    const approved = await Campaign.find({
      $or: [
        { status: "approved" },
        { status: { $exists: false }, isApproved: true },
        { isApproved: true }
      ],
    })
    .populate({
      path: "owner",
      select: "name email clerkId provider",
      options: { strictPopulate: false }
    })
    .sort({ approvedAt: -1, createdAt: -1 })
    .lean();

    // Handle missing owners
    const campaigns = approved.map(campaign => {
      const campaignObj = { ...campaign };
      if (!campaignObj.owner || (typeof campaignObj.owner === 'object' && !campaignObj.owner._id)) {
        campaignObj.owner = {
          name: "Unknown User",
          email: "unknown@user.com",
          clerkId: null,
          provider: "unknown"
        };
      }
      return campaignObj;
    });

    return res.json({ success: true, campaigns });

  } catch (err) {
    console.error("Error fetching approved campaigns:", err);
    return res.status(500).json({ success: false, message: "Failed to load approved", error: err.message });
  }
};

// ✅ REJECTED CAMPAIGNS
export const getRejectedCampaignsAdmin = async (req, res) => {
  try {
    const rejected = await Campaign.find({
      status: "rejected"
    })
    .populate({
      path: "owner",
      select: "name email clerkId provider",
      options: { strictPopulate: false }
    })
    .sort({ createdAt: -1 })
    .lean();

    // Handle missing owners
    const campaigns = rejected.map(campaign => {
      const campaignObj = { ...campaign };
      if (!campaignObj.owner || (typeof campaignObj.owner === 'object' && !campaignObj.owner._id)) {
        campaignObj.owner = {
          name: "Unknown User",
          email: "unknown@user.com",
          clerkId: null,
          provider: "unknown"
        };
      }
      return campaignObj;
    });

    return res.json({ success: true, campaigns });

  } catch (err) {
    console.error("Error fetching rejected campaigns:", err);
    return res.status(500).json({ success: false, message: "Failed to load rejected", error: err.message });
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
        approvedAt: new Date(),
        requiresMoreInfo: false,
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
        isApproved: false,
        requiresMoreInfo: false,
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

// ✅ REQUEST ADDITIONAL INFORMATION
export const requestAdditionalInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const rawMessage = req.body?.message || "";
    const message = rawMessage.trim();

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const requestPayload = {
      message,
      createdAt: new Date(),
      status: "pending",
      requestedBy: req.admin?.id || "admin",
    };

    const campaign = await Campaign.findByIdAndUpdate(
      id,
      {
        $set: {
          requiresMoreInfo: true,
          lastInfoRequestAt: requestPayload.createdAt,
        },
        $push: { infoRequests: requestPayload },
      },
      { new: true }
    );

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    await notifyOwner({
      ownerId: campaign.owner,
      overrideName: campaign?.beneficiaryName,
      message: `Admin request: ${message}`,
    });

    return res.json({
      success: true,
      message: "Information request sent",
      campaign,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to request additional information",
    });
  }
};
