// controllers/adminController.js
import Admin from "../models/Admin.js";
import User from "../models/User.js";
import Campaign from "../models/Campaign.js";
import Donation from "../models/Donation.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { sendSms } from "../utils/sendSms.js";
import { notifyOwner } from "../utils/notifyOwner.js";

/**
 * Helper: find admin by email searching Admin collection first,
 * then User collection with role: 'admin' as a fallback.
 */
async function findAdminByEmail(email) {
  let admin = null;
  try {
    if (Admin) {
      admin = await Admin.findOne({ email }).lean();
      if (admin) return { admin, source: "Admin" };
    }
  } catch (e) {
    // ignore - Admin model might not exist or might throw
    console.warn("Admin model lookup error (ignored):", e.message);
  }

  // fallback to User collection with role: admin
  admin = await User.findOne({ email, role: "admin" }).lean();
  if (admin) return { admin, source: "User" };

  return { admin: null, source: null };
}

/* ---------------------------------------------------
   ADMIN LOGIN (unified)
   - Looks for Admin model first, then User (role: admin)
   - Supports bcrypt hashed passwords and plain-text (defensive)
---------------------------------------------------- */
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const { admin, source } = await findAdminByEmail(email);

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    // Compare hashed password (bcrypt) if possible, otherwise fallback to direct compare
    let match = false;
    try {
      if (admin.password) {
        match = await bcrypt.compare(password, admin.password);
      }
    } catch (err) {
      match = false;
    }

    // fallback if password wasn't hashed and direct compare matches
    if (!match && admin.password && admin.password === password) {
      match = true;
    }

    if (!match) {
      return res.status(401).json({ success: false, message: "Invalid password" });
    }

    const secret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT secret missing: set ADMIN_JWT_SECRET or JWT_SECRET");
      return res.status(500).json({ success: false, message: "Server misconfiguration: JWT secret missing" });
    }

    const token = jwt.sign(
      { id: admin._id || admin.id, role: "admin", source },
      secret,
      { expiresIn: "7d" }
    );

    return res.json({ success: true, token });
  } catch (err) {
    console.error("adminLogin error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/* ---------------------------------------------------
   Campaign lists (pending / approved / rejected)
   - Pagination + search
   - Defensive owner population & normalization
---------------------------------------------------- */
function normalizeOwner(owner) {
  if (!owner) {
    return {
      name: "Unknown User",
      email: "unknown@user.com",
      clerkId: null,
      provider: "unknown",
      _id: null,
    };
  }
  // If owner is string id, return partial
  if (typeof owner === "string" || typeof owner === "number") {
    return { name: "Unknown User", email: "unknown@user.com", _id: owner };
  }
  // If owner is object
  return {
    name: owner.name || "Unknown User",
    email: owner.email || "unknown@user.com",
    clerkId: owner.clerkId || null,
    provider: owner.provider || "unknown",
    _id: owner._id || null,
  };
}

/* --------------------------------------------
   GET PENDING CAMPAIGNS
--------------------------------------------- */
export const getPendingCampaigns = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build flexible query for "pending"
    const query = {
      $or: [
        { status: { $exists: false } },
        { status: null },
        { status: "" },
        {
          status: {
            $not: {
              $in: ["approved", "Approved", "rejected", "Rejected", "deleted"],
            },
          },
        },
      ],
      deleted: { $ne: true },
    };

    if (search) {
      query.$and = [
        {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { shortDescription: { $regex: search, $options: "i" } },
            { beneficiaryName: { $regex: search, $options: "i" } },
            { city: { $regex: search, $options: "i" } },
            { category: { $regex: search, $options: "i" } },
          ],
        },
      ];
    }

    const [pending, total] = await Promise.all([
      Campaign.find(query)
        .populate({ path: "owner", select: "name email clerkId provider createdAt", options: { strictPopulate: false } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Campaign.countDocuments(query),
    ]);

    const campaigns = pending.map(c => {
      const owner = normalizeOwner(c.owner);
      return { ...c, owner, status: c.status || "pending" };
    });

    return res.json({
      success: true,
      campaigns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("getPendingCampaigns error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/* --------------------------------------------
   GET APPROVED CAMPAIGNS (Admin view)
--------------------------------------------- */
export const getApprovedCampaignsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {
      $or: [
        { status: "approved" },
        { isApproved: true },
        { status: { $in: ["Approved"] } },
      ],
      deleted: { $ne: true },
    };

    if (search) {
      query.$and = [
        {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { shortDescription: { $regex: search, $options: "i" } },
            { beneficiaryName: { $regex: search, $options: "i" } },
            { city: { $regex: search, $options: "i" } },
            { category: { $regex: search, $options: "i" } },
          ],
        },
      ];
    }

    const [approved, total] = await Promise.all([
      Campaign.find(query)
        .populate({ path: "owner", select: "name email clerkId provider createdAt", options: { strictPopulate: false } })
        .sort({ approvedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Campaign.countDocuments(query),
    ]);

    const campaigns = approved.map(c => ({ ...c, owner: normalizeOwner(c.owner) }));

    return res.json({
      success: true,
      campaigns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("getApprovedCampaignsAdmin error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/* --------------------------------------------
   GET REJECTED CAMPAIGNS (Admin view)
--------------------------------------------- */
export const getRejectedCampaignsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { status: "rejected", deleted: { $ne: true } };

    if (search) {
      query.$and = [
        {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { shortDescription: { $regex: search, $options: "i" } },
            { beneficiaryName: { $regex: search, $options: "i" } },
            { city: { $regex: search, $options: "i" } },
            { category: { $regex: search, $options: "i" } },
          ],
        },
      ];
    }

    const [rejected, total] = await Promise.all([
      Campaign.find(query)
        .populate({ path: "owner", select: "name email clerkId provider createdAt", options: { strictPopulate: false } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Campaign.countDocuments(query),
    ]);

    const campaigns = rejected.map(c => ({ ...c, owner: normalizeOwner(c.owner) }));

    return res.json({
      success: true,
      campaigns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("getRejectedCampaignsAdmin error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/* ---------------------------------------------------
   APPROVE CAMPAIGN
   - Updates adminActions array and other flags
---------------------------------------------------- */
export const approveCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "Campaign id required" });

    const updated = await Campaign.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "approved",
          isApproved: true,
          approvedAt: new Date(),
          requiresMoreInfo: false,
        },
        $push: {
          adminActions: {
            action: "approved",
            createdAt: new Date(),
            message: "Your campaign has been approved and is now live!",
            viewed: false,
          },
        },
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: "Campaign not found" });

    // notify owner (best-effort)
    try {
      await notifyOwner({ ownerId: updated.owner, message: "Your campaign has been approved!" });
    } catch (notifyErr) {
      console.warn("notifyOwner failed:", notifyErr.message);
    }

    return res.json({ success: true, message: "Campaign approved", campaign: updated });
  } catch (err) {
    console.error("approveCampaign error:", err);
    return res.status(500).json({ success: false, message: "Error approving campaign", error: err.message });
  }
};

/* ---------------------------------------------------
   REJECT CAMPAIGN
---------------------------------------------------- */
export const rejectCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body || {};

    if (!id) return res.status(400).json({ success: false, message: "Campaign id required" });

    const updated = await Campaign.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "rejected",
          isApproved: false,
          requiresMoreInfo: false,
        },
        $push: {
          adminActions: {
            action: "rejected",
            createdAt: new Date(),
            message: message || "Your campaign has been rejected. Please review the requirements and resubmit.",
            viewed: false,
          },
        },
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: "Campaign not found" });

    // notify owner
    try {
      await notifyOwner({ ownerId: updated.owner, message: `Your campaign has been rejected. ${message || ""}` });
    } catch (notifyErr) {
      console.warn("notifyOwner failed:", notifyErr.message);
    }

    return res.json({ success: true, message: "Campaign rejected", campaign: updated });
  } catch (err) {
    console.error("rejectCampaign error:", err);
    return res.status(500).json({ success: false, message: "Rejection failed", error: err.message });
  }
};

/* ---------------------------------------------------
   EDIT CAMPAIGN
---------------------------------------------------- */
export const editCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    if (!id) return res.status(400).json({ success: false, message: "Campaign id required" });

    const updated = await Campaign.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ success: false, message: "Campaign not found" });

    return res.json({ success: true, campaign: updated });
  } catch (err) {
    console.error("editCampaign error:", err);
    return res.status(500).json({ success: false, message: "Edit failed", error: err.message });
  }
};

/* ---------------------------------------------------
   DELETE CAMPAIGN (soft delete)
---------------------------------------------------- */
export const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "Campaign id required" });

    const updated = await Campaign.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "deleted",
          deleted: true,
        },
        $push: {
          adminActions: {
            action: "deleted",
            createdAt: new Date(),
            message: "Your campaign has been deleted by the admin.",
            viewed: false,
          },
        },
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: "Campaign not found" });

    try {
      await notifyOwner({ ownerId: updated.owner, message: "Your campaign has been deleted by the admin." });
    } catch (notifyErr) {
      console.warn("notifyOwner failed:", notifyErr.message);
    }

    return res.json({ success: true, message: "Campaign deleted successfully", campaign: updated });
  } catch (err) {
    console.error("deleteCampaign error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

/* ---------------------------------------------------
   REQUEST ADDITIONAL INFORMATION (from admin to owner)
---------------------------------------------------- */
export const requestAdditionalInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const rawMessage = (req.body && req.body.message) || "";
    const message = rawMessage.trim();
    if (!id) return res.status(400).json({ success: false, message: "Campaign id required" });
    if (!message) return res.status(400).json({ success: false, message: "Message is required" });

    const requestPayload = {
      message,
      createdAt: new Date(),
      status: "pending",
      requestedBy: req.admin?.id || req.admin?._id || "admin",
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

    if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });

    // notify owner
    try {
      await notifyOwner({
        ownerId: campaign.owner,
        overrideName: campaign?.beneficiaryName,
        message: `Admin request: ${message}`,
      });
    } catch (notifyErr) {
      console.warn("notifyOwner failed:", notifyErr.message);
    }

    return res.json({ success: true, message: "Information request sent", campaign });
  } catch (err) {
    console.error("requestAdditionalInfo error:", err);
    return res.status(500).json({ success: false, message: "Failed to request additional information", error: err.message });
  }
};

/* ---------------------------------------------------
   RESOLVE INFO REQUEST
---------------------------------------------------- */
export const resolveInfoRequest = async (req, res) => {
  try {
    const { id, requestId } = req.params;
    if (!id || !requestId) return res.status(400).json({ success: false, message: "Campaign id and requestId are required" });

    const campaign = await Campaign.findById(id);
    if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });

    const infoRequest = campaign.infoRequests?.id(requestId);
    if (!infoRequest) return res.status(404).json({ success: false, message: "Info request not found" });

    infoRequest.status = "resolved";
    infoRequest.resolvedAt = new Date();
    infoRequest.resolvedBy = req.admin?.id || req.admin?._id || "admin";

    const hasPending = campaign.infoRequests.some(r => r.status !== "resolved");
    campaign.requiresMoreInfo = hasPending;
    if (!hasPending) campaign.lastInfoRequestAt = null;

    await campaign.save();

    return res.json({
      success: true,
      message: "Info request marked as resolved",
      request: infoRequest.toObject ? infoRequest.toObject() : infoRequest,
      campaign: campaign.toObject ? campaign.toObject() : campaign,
    });
  } catch (err) {
    console.error("resolveInfoRequest error:", err);
    return res.status(500).json({ success: false, message: "Failed to resolve info request", error: err.message });
  }
};

/* ---------------------------------------------------
   GET CAMPAIGN WITH USER RESPONSES
---------------------------------------------------- */
export const getCampaignWithResponses = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "Campaign id required" });

    const campaign = await Campaign.findById(id)
      .populate("owner", "name email clerkId")
      .lean();

    if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });

    const infoRequests = campaign.infoRequests || [];
    const requestsWithResponses = infoRequests.map(r => ({
      ...r,
      responses: r.responses || [],
      hasNewResponse: r.responses?.some(resp => !resp.adminViewed),
    }));

    return res.json({ success: true, campaign: { ...campaign, infoRequests: requestsWithResponses } });
  } catch (err) {
    console.error("getCampaignWithResponses error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch campaign details", error: err.message });
  }
};

/* ---------------------------------------------------
   ADMIN RESPOND TO USER'S SECOND ATTEMPT
   - id = campaignId, requestId, responseId
---------------------------------------------------- */
export const adminRespondToUserResponse = async (req, res) => {
  try {
    const { id, requestId, responseId } = req.params;
    const { message, action } = req.body || {};

    if (!id || !requestId || !responseId) {
      return res.status(400).json({ success: false, message: "campaign id, requestId and responseId are required" });
    }

    const campaign = await Campaign.findById(id);
    if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });

    const infoRequest = campaign.infoRequests?.id(requestId);
    if (!infoRequest) return res.status(404).json({ success: false, message: "Info request not found" });

    const userResponse = infoRequest.responses?.id(responseId);
    if (!userResponse) return res.status(404).json({ success: false, message: "User response not found" });

    userResponse.adminViewed = true;
    userResponse.adminViewedAt = new Date();

    if (message || action) {
      if (action === "request_more" && message) {
        const followUpRequest = {
          message,
          createdAt: new Date(),
          status: "pending",
          requestedBy: req.admin?.id || req.admin?._id || "admin",
          parentRequestId: requestId,
          parentResponseId: responseId,
        };
        campaign.infoRequests.push(followUpRequest);
        campaign.requiresMoreInfo = true;
        campaign.lastInfoRequestAt = new Date();
      } else if (action === "approve") {
        infoRequest.status = "resolved";
        infoRequest.resolvedAt = new Date();
        infoRequest.resolvedBy = req.admin?.id || req.admin?._id || "admin";
        infoRequest.resolutionMessage = message || "Response approved. Proceeding.";
        const hasPending = campaign.infoRequests.some(reqItem => reqItem.status !== "resolved" && reqItem._id.toString() !== requestId);
        if (!hasPending) {
          campaign.requiresMoreInfo = false;
          campaign.lastInfoRequestAt = null;
        }
      } else if (action === "reject") {
        infoRequest.status = "rejected";
        infoRequest.resolvedAt = new Date();
        infoRequest.resolvedBy = req.admin?.id || req.admin?._id || "admin";
        infoRequest.resolutionMessage = message || "Response rejected.";
      }
    }

    await campaign.save();

    return res.json({ success: true, message: "Response processed successfully", campaign: campaign.toObject ? campaign.toObject() : campaign });
  } catch (err) {
    console.error("adminRespondToUserResponse error:", err);
    return res.status(500).json({ success: false, message: "Failed to process user response", error: err.message });
  }
};

/* ---------------------------------------------------
   GET CAMPAIGNS WITH PENDING RESPONSES
---------------------------------------------------- */
export const getCampaignsWithPendingResponses = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const campaigns = await Campaign.find({
      "infoRequests.responses.adminViewed": { $ne: true },
      deleted: { $ne: true },
    })
      .populate("owner", "name email")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const campaignsWithPending = campaigns
      .map(campaign => {
        const pendingRequests = (campaign.infoRequests || []).filter(req => {
          const responses = req.responses || [];
          return responses.some(resp => !resp.adminViewed);
        });

        if (pendingRequests.length === 0) return null;

        return {
          ...campaign,
          owner: normalizeOwner(campaign.owner),
          pendingRequests: pendingRequests.map(req => ({
            ...req,
            unviewedResponses: (req.responses || []).filter(resp => !resp.adminViewed),
          })),
        };
      })
      .filter(c => c !== null);

    const total = await Campaign.countDocuments({
      "infoRequests.responses.adminViewed": { $ne: true },
      deleted: { $ne: true },
    });

    return res.json({
      success: true,
      campaigns: campaignsWithPending,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("getCampaignsWithPendingResponses error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch campaigns with pending responses", error: err.message });
  }
};

/* ---------------------------------------------------
   ACTIVITY LOG - consolidated multi-source
---------------------------------------------------- */
export const getActivityLog = async (req, res) => {
  try {
    const { page = 1, limit = 50, type, userId, campaignId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const activities = [];

    // Campaign activities
    if (!type || type === "campaign") {
      const campaignQuery = {};
      if (campaignId) campaignQuery._id = campaignId;
      if (userId) campaignQuery.owner = userId;

      const campaigns = await Campaign.find(campaignQuery)
        .populate("owner", "name email")
        .sort({ updatedAt: -1 })
        .skip(type === "campaign" ? skip : 0)
        .limit(type === "campaign" ? parseInt(limit) : 10)
        .lean();

      campaigns.forEach(campaign => {
        activities.push({
          type: "campaign_created",
          timestamp: campaign.createdAt,
          user: campaign.owner,
          campaign: { id: campaign._id, title: campaign.title },
          details: `Campaign "${campaign.title}" was created`,
        });

        if (campaign.adminActions) {
          campaign.adminActions.forEach(action => {
            activities.push({
              type: `campaign_${action.action}`,
              timestamp: action.createdAt,
              user: campaign.owner,
              campaign: { id: campaign._id, title: campaign.title },
              details: action.message || `Campaign ${action.action}`,
              adminAction: action,
            });
          });
        }

        if (campaign.infoRequests) {
          campaign.infoRequests.forEach(req => {
            activities.push({
              type: "info_request_sent",
              timestamp: req.createdAt,
              user: campaign.owner,
              campaign: { id: campaign._id, title: campaign.title },
              details: `Info request sent: ${req.message}`,
            });

            if (req.responses) {
              req.responses.forEach(resp => {
                activities.push({
                  type: "user_response",
                  timestamp: resp.uploadedAt || resp.createdAt,
                  user: campaign.owner,
                  campaign: { id: campaign._id, title: campaign.title },
                  details: `User responded to info request`,
                  response: resp,
                });
              });
            }
          });
        }
      });
    }

    // User activities
    if (!type || type === "user") {
      const userQuery = {};
      if (userId) userQuery._id = userId;

      const users = await User.find(userQuery)
        .sort({ createdAt: -1 })
        .skip(type === "user" ? skip : 0)
        .limit(type === "user" ? parseInt(limit) : 10)
        .lean();

      users.forEach(user => {
        activities.push({
          type: "user_registered",
          timestamp: user.createdAt,
          user: { id: user._id, name: user.name, email: user.email },
          details: `User ${user.name} registered`,
        });
      });
    }

    // Donation activities
    if (!type || type === "donation") {
      const donationQuery = {};
      if (campaignId) donationQuery.campaignId = campaignId;

      const donations = await Donation.find(donationQuery)
        .populate("campaignId", "title")
        .sort({ createdAt: -1 })
        .skip(type === "donation" ? skip : 0)
        .limit(type === "donation" ? parseInt(limit) : 10)
        .lean();

      donations.forEach(donation => {
        activities.push({
          type: "donation_made",
          timestamp: donation.createdAt,
          campaign: { id: donation.campaignId?._id, title: donation.campaignId?.title },
          details: `Donation of ${donation.currency || "₹"}${donation.amount} made`,
          donation,
        });
      });
    }

    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const paginatedActivities = activities.slice(skip, skip + parseInt(limit));
    const total = activities.length;

    return res.json({
      success: true,
      activities: paginatedActivities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("getActivityLog error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch activity log", error: err.message });
  }
};

/* ---------------------------------------------------
   DASHBOARD STATS
---------------------------------------------------- */
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalCampaigns,
      pendingCampaigns,
      approvedCampaigns,
      rejectedCampaigns,
      totalDonations,
      totalRaisedAgg,
      recentUsers,
      recentCampaigns,
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: "admin" } }),
      Campaign.countDocuments({ deleted: { $ne: true } }),
      Campaign.countDocuments({
        $or: [
          { status: { $exists: false } },
          { status: null },
          { status: "" },
          { status: { $not: { $in: ["approved", "Approved", "rejected", "Rejected"] } } },
        ],
        deleted: { $ne: true },
      }),
      Campaign.countDocuments({ status: "approved", deleted: { $ne: true } }),
      Campaign.countDocuments({ status: "rejected", deleted: { $ne: true } }),
      Donation.countDocuments(),
      Campaign.aggregate([
        { $match: { deleted: { $ne: true } } },
        { $group: { _id: null, total: { $sum: "$raisedAmount" } } },
      ]),
      User.find({ role: { $ne: "admin" } }).sort({ createdAt: -1 }).limit(5).select("name email provider createdAt").lean(),
      Campaign.find({ deleted: { $ne: true } }).sort({ createdAt: -1 }).limit(5).select("title status createdAt owner").populate("owner", "name email").lean(),
    ]);

    const totalRaised = (totalRaisedAgg && totalRaisedAgg[0] && totalRaisedAgg[0].total) || 0;

    // last 30 days metrics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [newUsersLast30Days, newCampaignsLast30Days, raisedLast30DaysAgg] = await Promise.all([
      User.countDocuments({ role: { $ne: "admin" }, createdAt: { $gte: thirtyDaysAgo } }),
      Campaign.countDocuments({ deleted: { $ne: true }, createdAt: { $gte: thirtyDaysAgo } }),
      Campaign.aggregate([
        { $match: { deleted: { $ne: true }, createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: "$raisedAmount" } } },
      ]),
    ]);

    const raisedLast30Days = (raisedLast30DaysAgg && raisedLast30DaysAgg[0] && raisedLast30DaysAgg[0].total) || 0;

    return res.json({
      success: true,
      stats: {
        users: { total: totalUsers, newLast30Days: newUsersLast30Days },
        campaigns: {
          total: totalCampaigns,
          pending: pendingCampaigns,
          approved: approvedCampaigns,
          rejected: rejectedCampaigns,
          newLast30Days: newCampaignsLast30Days,
        },
        donations: {
          totalCount: totalDonations,
          totalRaised,
          raisedLast30Days,
        },
        recent: {
          users: recentUsers,
          campaigns: recentCampaigns,
        },
      },
    });
  } catch (err) {
    console.error("getDashboardStats error:", err);
    return res.status(500).json({ success: false, message: "Failed to load dashboard statistics", error: err.message });
  }
};

/* ---------------------------------------------------
   GET ALL USERS (non-admin)
---------------------------------------------------- */
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "", sortBy = "createdAt", sortOrder = "desc" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const query = { role: { $ne: "admin" } };
    if (search) {
      query.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }];
    }

    const [users, total] = await Promise.all([
      User.find(query).sort(sort).skip(skip).limit(parseInt(limit)).select("-password").lean(),
      User.countDocuments(query),
    ]);

    // augment with user stats (campaigns count + raised)
    const usersWithStats = await Promise.all(users.map(async user => {
      const campaignsCount = await Campaign.countDocuments({ $or: [{ owner: user._id }, { owner: user._id.toString() }], deleted: { $ne: true } });
      const raisedAgg = await Campaign.aggregate([
        { $match: { $or: [{ owner: user._id }, { owner: user._id.toString() }], deleted: { $ne: true } } },
        { $group: { _id: null, total: { $sum: "$raisedAmount" } } },
      ]);
      const totalRaised = (raisedAgg && raisedAgg[0] && raisedAgg[0].total) || 0;
      return { ...user, stats: { campaignsCount, totalRaised } };
    }));

    return res.json({
      success: true,
      users: usersWithStats,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    console.error("getAllUsers error:", err);
    return res.status(500).json({ success: false, message: "Failed to load users", error: err.message });
  }
};

/* ---------------------------------------------------
   GET USER DETAILS (and user's campaigns + donations)
---------------------------------------------------- */
export const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "User id required" });

    const user = await User.findById(id).select("-password").lean();
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const campaigns = await Campaign.find({ $or: [{ owner: id }, { owner: id.toString() }], deleted: { $ne: true } }).sort({ createdAt: -1 }).lean();

    // donations for user's campaigns
    const campaignIds = campaigns.map(c => c._id);
    const donations = await Donation.find({ campaignId: { $in: campaignIds } }).sort({ createdAt: -1 }).lean();

    const totalRaised = campaigns.reduce((sum, c) => sum + (c.raisedAmount || 0), 0);

    return res.json({
      success: true,
      user: {
        ...user,
        stats: {
          campaignsCount: campaigns.length,
          totalRaised,
          donationsCount: donations.length,
        },
        campaigns,
        donations,
      },
    });
  } catch (err) {
    console.error("getUserDetails error:", err);
    return res.status(500).json({ success: false, message: "Failed to load user details", error: err.message });
  }
};

/* ---------------------------------------------------
   ADMIN PAYMENT MANAGEMENT - getAllPayments
   - Flexible filters / stats
---------------------------------------------------- */
export const getAllPayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      riskLevel,
      isSuspicious,
      paymentStatus,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};

    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (riskLevel) query.riskLevel = riskLevel;
    if (isSuspicious === "true") query.isSuspicious = true;
    if (isSuspicious === "false") query.isSuspicious = false;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = Number(minAmount);
      if (maxAmount) query.amount.$lte = Number(maxAmount);
    }

    if (search) {
      query.$or = [{ receiptNumber: { $regex: search, $options: "i" } }, { message: { $regex: search, $options: "i" } }];
    }

    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [donations, total] = await Promise.all([
      Donation.find(query).populate("donorId", "name email phone").populate("campaignId", "title beneficiaryName").sort(sort).skip(skip).limit(parseInt(limit)).lean(),
      Donation.countDocuments(query),
    ]);

    const statsAgg = await Donation.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          totalCount: { $sum: 1 },
          suspiciousCount: { $sum: { $cond: ["$isSuspicious", 1, 0] } },
          pendingCount: { $sum: { $cond: [{ $eq: ["$paymentStatus", "pending"] }, 1, 0] } },
          successCount: { $sum: { $cond: [{ $eq: ["$paymentStatus", "success"] }, 1, 0] } },
        },
      },
    ]);

    return res.json({
      success: true,
      payments: donations,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
      stats: statsAgg[0] || { totalAmount: 0, totalCount: 0, suspiciousCount: 0, pendingCount: 0, successCount: 0 },
    });
  } catch (err) {
    console.error("getAllPayments error:", err);
    return res.status(500).json({ success: false, message: "Failed to load payments", error: err.message });
  }
};

/* ---------------------------------------------------
   GET PAYMENT DETAILS
---------------------------------------------------- */
export const getPaymentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "Payment id required" });

    const donation = await Donation.findById(id)
      .populate("donorId", "name email phone profilePicture")
      .populate("campaignId", "title beneficiaryName imageUrl")
      .populate("reviewedBy", "name email")
      .populate("paymentVerifiedBy", "name email")
      .lean();

    if (!donation) return res.status(404).json({ success: false, message: "Payment not found" });

    const relatedDonations = await Donation.find({
      $or: [{ donorId: donation.donorId }, { ipAddress: donation.ipAddress }],
      _id: { $ne: donation._id },
    }).populate("campaignId", "title").sort({ createdAt: -1 }).limit(10).lean();

    return res.json({ success: true, payment: donation, relatedDonations });
  } catch (err) {
    console.error("getPaymentDetails error:", err);
    return res.status(500).json({ success: false, message: "Failed to load payment details", error: err.message });
  }
};

/* ---------------------------------------------------
   APPROVE SINGLE DONATION (and optionally SMS)
---------------------------------------------------- */
export const approveDonation = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "Donation id required" });

    const donation = await Donation.findById(id);
    if (!donation) return res.status(404).json({ success: false, message: "Donation not found" });

    donation.status = "approved";
    donation.approvedAt = new Date();
    // mark reviewed/verified by admin if you store such fields
    if (req.admin?.id || req.admin?._id) donation.reviewedByAdmin = req.admin.id || req.admin._id;

    await donation.save();

    // send sms to donor/contact/ownerPhone
    const numbers = [];
    if (donation.donor?.phone) numbers.push(donation.donor.phone);
    if (donation.contact?.phone) numbers.push(donation.contact.phone);
    if (donation.ownerPhone) numbers.push(donation.ownerPhone);

    const uniqueNumbers = [...new Set(numbers.filter(Boolean))];
    if (uniqueNumbers.length > 0) {
      try {
        await sendSms({ numbers: uniqueNumbers, message: "Your donation has been approved. Thank you." });
      } catch (smsErr) {
        console.warn("sendSms failed:", smsErr.message);
      }
    }

    return res.json({ success: true, message: "Donation approved", donation });
  } catch (err) {
    console.error("approveDonation error:", err);
    return res.status(500).json({ success: false, message: "Failed to approve donation", error: err.message });
  }
};

/* ---------------------------------------------------
   APPROVE ALL DONATIONS FOR CAMPAIGN (and SMS)
---------------------------------------------------- */
export const approveAllForCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    if (!campaignId) return res.status(400).json({ success: false, message: "Campaign id required" });

    // 1) approve campaign
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });

    campaign.status = "approved";
    campaign.isApproved = true;
    campaign.approvedAt = new Date();
    campaign.requiresMoreInfo = false;
    await campaign.save();

    // 2) approve donations
    const donations = await Donation.find({ campaign: campaignId });
    const phones = [];

    for (const donation of donations) {
      donation.status = "approved";
      donation.approvedAt = new Date();
      await donation.save();

      if (donation.donor?.phone) phones.push(donation.donor.phone);
      if (donation.contact?.phone) phones.push(donation.contact.phone);
      if (donation.ownerPhone) phones.push(donation.ownerPhone);
    }

    const uniquePhones = [...new Set(phones.filter(Boolean))];
    if (uniquePhones.length > 0) {
      try {
        await sendSms({ numbers: uniquePhones, message: "Your request has been approved successfully. Thank you." });
      } catch (smsErr) {
        console.warn("sendSms failed:", smsErr.message);
      }
    }

    // notify owner
    try {
      await notifyOwner({ ownerId: campaign.owner, message: "Your campaign and all donations have been approved." });
    } catch (notifyErr) {
      console.warn("notifyOwner failed:", notifyErr.message);
    }

    return res.json({ success: true, message: "Campaign + all donations approved. SMS attempted.", campaign });
  } catch (err) {
    console.error("approveAllForCampaign error:", err);
    return res.status(500).json({ success: false, message: "Failed to approve all for campaign", error: err.message });
  }
};

export default {
  adminLogin,
  getPendingCampaigns,
  getApprovedCampaignsAdmin,
  getRejectedCampaignsAdmin,
  approveCampaign,
  rejectCampaign,
  editCampaign,
  deleteCampaign,
  requestAdditionalInfo,
  resolveInfoRequest,
  getCampaignWithResponses,
  adminRespondToUserResponse,
  getCampaignsWithPendingResponses,
  getActivityLog,
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  getAllPayments,
  getPaymentDetails,
  approveDonation,
  approveAllForCampaign,
};
