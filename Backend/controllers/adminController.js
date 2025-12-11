// controllers/adminController.js

import User from "../models/User.js";
import Campaign from "../models/Campaign.js";
import Donation from "../models/Donation.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { notifyOwner } from "../utils/notifyOwner.js";

// near other imports



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

// ✅ PENDING CAMPAIGNS (with pagination and search)
export const getPendingCampaigns = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    const query = {
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
    };

    // Add search filter
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
        .populate({
          path: "owner",
          select: "name email clerkId provider createdAt",
          options: { strictPopulate: false },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Campaign.countDocuments(query),
    ]);

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
    console.error("Error fetching pending campaigns:", err);
    return res.status(500).json({ success: false, message: "Failed to load pending", error: err.message });
  }
};

// ✅ APPROVED CAMPAIGNS (with pagination and search)
export const getApprovedCampaignsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {
      $or: [
        { status: "approved" },
        { status: { $exists: false }, isApproved: true },
        { isApproved: true }
      ],
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
        .populate({
          path: "owner",
          select: "name email clerkId provider createdAt",
          options: { strictPopulate: false },
        })
        .sort({ approvedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Campaign.countDocuments(query),
    ]);

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
    console.error("Error fetching approved campaigns:", err);
    return res.status(500).json({ success: false, message: "Failed to load approved", error: err.message });
  }
};

// ✅ REJECTED CAMPAIGNS (with pagination and search)
export const getRejectedCampaignsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { status: "rejected" };

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
        .populate({
          path: "owner",
          select: "name email clerkId provider createdAt",
          options: { strictPopulate: false },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Campaign.countDocuments(query),
    ]);

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

    if (!updated) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }
    const { phone } = req.body;
await sendSimpleSMS(phone);


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
    const { message } = req.body;

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
    const { id } = req.params;
    
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

    if (!updated) {
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

// ✅ MARK INFO REQUEST AS RESOLVED
export const resolveInfoRequest = async (req, res) => {
  try {
    const { id, requestId } = req.params;

    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    const infoRequest = campaign.infoRequests?.id(requestId);

    if (!infoRequest) {
      return res.status(404).json({
        success: false,
        message: "Info request not found",
      });
    }

    infoRequest.status = "resolved";
    infoRequest.resolvedAt = new Date();
    infoRequest.resolvedBy = req.admin?.id || "admin";

    const hasPending = campaign.infoRequests.some(
      (reqItem) => reqItem.status !== "resolved"
    );
    campaign.requiresMoreInfo = hasPending;
    if (!hasPending) {
      campaign.lastInfoRequestAt = null;
    }

    await campaign.save();

    return res.json({
      success: true,
      message: "Info request marked as resolved",
      request: infoRequest.toObject ? infoRequest.toObject() : infoRequest,
      campaign: campaign.toObject(),
    });
  } catch (error) {
    console.error("Resolve info request error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to resolve info request",
    });
  }
};

// ✅ GET CAMPAIGN WITH USER RESPONSES TO INFO REQUESTS
export const getCampaignWithResponses = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findById(id)
      .populate("owner", "name email clerkId")
      .lean();

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Get all info requests with their responses
    const infoRequests = campaign.infoRequests || [];
    const requestsWithResponses = infoRequests.map((req) => ({
      ...req,
      responses: req.responses || [],
      hasNewResponse: req.responses?.some(
        (resp) => !resp.adminViewed || resp.adminViewed === false
      ),
    }));

    return res.json({
      success: true,
      campaign: {
        ...campaign,
        infoRequests: requestsWithResponses,
      },
    });
  } catch (error) {
    console.error("Error fetching campaign with responses:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch campaign details",
    });
  }
};

// ✅ ADMIN RESPOND TO USER'S SECOND ATTEMPT
export const adminRespondToUserResponse = async (req, res) => {
  try {
    const { id, requestId, responseId } = req.params;
    const { message, action } = req.body; // action: "approve", "request_more", "reject"

    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    const infoRequest = campaign.infoRequests?.id(requestId);
    if (!infoRequest) {
      return res.status(404).json({
        success: false,
        message: "Info request not found",
      });
    }

    const userResponse = infoRequest.responses?.id(responseId);
    if (!userResponse) {
      return res.status(404).json({
        success: false,
        message: "User response not found",
      });
    }

    // Mark user response as viewed by admin
    userResponse.adminViewed = true;
    userResponse.adminViewedAt = new Date();

    // Add admin's follow-up message/action
    if (message || action) {
      // Create a new info request for follow-up if needed
      if (action === "request_more" && message) {
        const followUpRequest = {
          message: message,
          createdAt: new Date(),
          status: "pending",
          requestedBy: req.admin?.id || "admin",
          parentRequestId: requestId,
          parentResponseId: responseId,
        };
        campaign.infoRequests.push(followUpRequest);
        campaign.requiresMoreInfo = true;
        campaign.lastInfoRequestAt = new Date();
      } else if (action === "approve") {
        // If admin approves the response, mark request as resolved
        infoRequest.status = "resolved";
        infoRequest.resolvedAt = new Date();
        infoRequest.resolvedBy = req.admin?.id || "admin";
        infoRequest.resolutionMessage = message || "Response approved. Proceeding with verification.";

        // Check if all requests are resolved
        const hasPending = campaign.infoRequests.some(
          (reqItem) => reqItem.status !== "resolved" && reqItem._id.toString() !== requestId
        );
        if (!hasPending) {
          campaign.requiresMoreInfo = false;
          campaign.lastInfoRequestAt = null;
        }
      }
    }

    await campaign.save();

    return res.json({
      success: true,
      message: "Response processed successfully",
      campaign: campaign.toObject(),
    });
  } catch (error) {
    console.error("Error processing user response:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process user response",
    });
  }
};

// ✅ GET ALL CAMPAIGNS WITH PENDING USER RESPONSES
export const getCampaignsWithPendingResponses = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find campaigns with info requests that have unviewed responses
    const campaigns = await Campaign.find({
      "infoRequests.responses.adminViewed": { $ne: true },
      deleted: { $ne: true },
    })
      .populate("owner", "name email")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Filter and format campaigns with pending responses
    const campaignsWithPending = campaigns
      .map((campaign) => {
        const pendingRequests = (campaign.infoRequests || []).filter((req) => {
          const responses = req.responses || [];
          return responses.some((resp) => !resp.adminViewed);
        });

        if (pendingRequests.length === 0) return null;

        return {
          ...campaign,
          pendingRequests: pendingRequests.map((req) => ({
            ...req,
            unviewedResponses: (req.responses || []).filter(
              (resp) => !resp.adminViewed
            ),
          })),
        };
      })
      .filter((c) => c !== null);

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
  } catch (error) {
    console.error("Error fetching campaigns with pending responses:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch campaigns with pending responses",
    });
  }
};

// ✅ GET COMPREHENSIVE ACTIVITY LOG
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

      campaigns.forEach((campaign) => {
        // Campaign creation
        activities.push({
          type: "campaign_created",
          timestamp: campaign.createdAt,
          user: campaign.owner,
          campaign: {
            id: campaign._id,
            title: campaign.title,
          },
          details: `Campaign "${campaign.title}" was created`,
        });

        // Admin actions
        if (campaign.adminActions) {
          campaign.adminActions.forEach((action) => {
            activities.push({
              type: `campaign_${action.action}`,
              timestamp: action.createdAt,
              user: campaign.owner,
              campaign: {
                id: campaign._id,
                title: campaign.title,
              },
              details: action.message || `Campaign ${action.action}`,
              adminAction: action,
            });
          });
        }

        // Info requests
        if (campaign.infoRequests) {
          campaign.infoRequests.forEach((req) => {
            activities.push({
              type: "info_request_sent",
              timestamp: req.createdAt,
              user: campaign.owner,
              campaign: {
                id: campaign._id,
                title: campaign.title,
              },
              details: `Info request sent: ${req.message}`,
            });

            // User responses
            if (req.responses) {
              req.responses.forEach((resp) => {
                activities.push({
                  type: "user_response",
                  timestamp: resp.uploadedAt,
                  user: campaign.owner,
                  campaign: {
                    id: campaign._id,
                    title: campaign.title,
                  },
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

      users.forEach((user) => {
        activities.push({
          type: "user_registered",
          timestamp: user.createdAt,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
          },
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

      donations.forEach((donation) => {
        activities.push({
          type: "donation_made",
          timestamp: donation.createdAt,
          campaign: {
            id: donation.campaignId?._id,
            title: donation.campaignId?.title,
          },
          details: `Donation of ₹${donation.amount} made`,
          donation: donation,
        });
      });
    }

    // Sort all activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply pagination
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
  } catch (error) {
    console.error("Error fetching activity log:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch activity log",
    });
  }
};

/* ---------------------------------------------------
   DASHBOARD STATISTICS
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
      totalRaisedResult,
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
      User.find({ role: { $ne: "admin" } })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name email provider createdAt")
        .lean(),
      Campaign.find({ deleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title status createdAt owner")
        .populate("owner", "name email")
        .lean(),
    ]);

    const totalRaised = totalRaisedResult[0]?.total || 0;

    // Calculate growth metrics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      newUsersLast30Days,
      newCampaignsLast30Days,
      raisedLast30DaysResult,
    ] = await Promise.all([
      User.countDocuments({
        role: { $ne: "admin" },
        createdAt: { $gte: thirtyDaysAgo },
      }),
      Campaign.countDocuments({
        deleted: { $ne: true },
        createdAt: { $gte: thirtyDaysAgo },
      }),
      Campaign.aggregate([
        {
          $match: {
            deleted: { $ne: true },
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        { $group: { _id: null, total: { $sum: "$raisedAmount" } } },
      ]),
    ]);

    const raisedLast30Days = raisedLast30DaysResult[0]?.total || 0;

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          newLast30Days: newUsersLast30Days,
        },
        campaigns: {
          total: totalCampaigns,
          pending: pendingCampaigns,
          approved: approvedCampaigns,
          rejected: rejectedCampaigns,
          newLast30Days: newCampaignsLast30Days,
        },
        donations: {
          totalCount: totalDonations,
          totalRaised: totalRaised,
          raisedLast30Days: raisedLast30Days,
        },
        recent: {
          users: recentUsers,
          campaigns: recentCampaigns,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard statistics",
    });
  }
};

/* ---------------------------------------------------
   GET ALL USERS
---------------------------------------------------- */
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "", sortBy = "createdAt", sortOrder = "desc" } = req.query;

    const query = { role: { $ne: "admin" } };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [users, total] = await Promise.all([
      User.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select("-password")
        .lean(),
      User.countDocuments(query),
    ]);

    // Get campaign counts for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const [campaignsCount, totalRaised] = await Promise.all([
          Campaign.countDocuments({
            $or: [
              { owner: user._id },
              { owner: user._id.toString() },
            ],
            deleted: { $ne: true },
          }),
          Campaign.aggregate([
            {
              $match: {
                $or: [
                  { owner: user._id },
                  { owner: user._id.toString() },
                ],
                deleted: { $ne: true },
              },
            },
            { $group: { _id: null, total: { $sum: "$raisedAmount" } } },
          ]).then((result) => result[0]?.total || 0),
        ]);

        return {
          ...user,
          stats: {
            campaignsCount,
            totalRaised,
          },
        };
      })
    );

    res.json({
      success: true,
      users: usersWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load users",
    });
  }
};

/* ---------------------------------------------------
   GET USER DETAILS
---------------------------------------------------- */
export const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password").lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const [campaigns, donations] = await Promise.all([
      Campaign.find({
        $or: [{ owner: id }, { owner: id.toString() }],
        deleted: { $ne: true },
      })
        .sort({ createdAt: -1 })
        .lean(),
      // Get donations for user's campaigns
      Campaign.find({
        $or: [{ owner: id }, { owner: id.toString() }],
        deleted: { $ne: true },
      })
        .select("_id")
        .lean()
        .then((campaigns) => {
          const campaignIds = campaigns.map((c) => c._id);
          return Donation.find({ campaignId: { $in: campaignIds } })
            .sort({ createdAt: -1 })
            .lean();
        }),
    ]);

    const totalRaised = campaigns.reduce((sum, c) => sum + (c.raisedAmount || 0), 0);

    res.json({
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
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load user details",
    });
  }
};

/* ---------------------------------------------------
   ADMIN PAYMENT MANAGEMENT
---------------------------------------------------- */

// Get all payments with filters
export const getAllPayments = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      riskLevel, 
      isSuspicious, 
      paymentStatus,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};

    // Filter by payment status
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    // Filter by risk level
    if (riskLevel) {
      query.riskLevel = riskLevel;
    }

    // Filter suspicious donations
    if (isSuspicious === "true") {
      query.isSuspicious = true;
    } else if (isSuspicious === "false") {
      query.isSuspicious = false;
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = Number(minAmount);
      if (maxAmount) query.amount.$lte = Number(maxAmount);
    }

    // Search filter (by donor name, email, campaign title, receipt number)
    if (search) {
      query.$or = [
        { receiptNumber: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [donations, total] = await Promise.all([
      Donation.find(query)
        .populate("donorId", "name email phone")
        .populate("campaignId", "title beneficiaryName")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Donation.countDocuments(query),
    ]);

    // Calculate statistics
    const stats = await Donation.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          totalCount: { $sum: 1 },
          suspiciousCount: {
            $sum: { $cond: ["$isSuspicious", 1, 0] }
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "pending"] }, 1, 0] }
          },
          successCount: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "success"] }, 1, 0] }
          },
        },
      },
    ]);

    res.json({
      success: true,
      payments: donations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
      stats: stats[0] || {
        totalAmount: 0,
        totalCount: 0,
        suspiciousCount: 0,
        pendingCount: 0,
        successCount: 0,
      },
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load payments",
      error: error.message,
    });
  }
};

// Get payment details
export const getPaymentDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const donation = await Donation.findById(id)
      .populate("donorId", "name email phone profilePicture")
      .populate("campaignId", "title beneficiaryName imageUrl")
      .populate("reviewedBy", "name email")
      .populate("paymentVerifiedBy", "name email")
      .lean();

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Get related donations from same donor/IP
    const relatedDonations = await Donation.find({
      $or: [
        { donorId: donation.donorId },
        { ipAddress: donation.ipAddress },
      ],
      _id: { $ne: donation._id },
    })
      .populate("campaignId", "title")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      payment: donation,
      relatedDonations,
    });
  } catch (error) {
    console.error("Error fetching payment details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load payment details",
      error: error.message,
    });
  }
};

// Mark payment as verified/received
export const verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentNotes } = req.body;
    const adminId = req.adminId; // From adminAuth middleware

    const donation = await Donation.findById(id);
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    donation.paymentReceived = true;
    donation.paymentReceivedAt = new Date();
    donation.paymentStatus = "success";
    donation.paymentVerifiedBy = adminId;
    if (paymentNotes) donation.paymentNotes = paymentNotes;

    await donation.save();

    // DEBUG: Log donation details to diagnose SMS issue
    console.log(`📱 ========== SMS DEBUG INFO ==========`);
    console.log(`📱 Donation ID: ${donation._id}`);
    console.log(`📱 donorPhone: "${donation.donorPhone}" (type: ${typeof donation.donorPhone}, length: ${donation.donorPhone?.length || 0})`);
    console.log(`📱 isAnonymous: ${donation.isAnonymous} (type: ${typeof donation.isAnonymous})`);
    console.log(`📱 donorName: "${donation.donorName}"`);
    console.log(`📱 donorEmail: "${donation.donorEmail}"`);
    console.log(`📱 paymentStatus: ${donation.paymentStatus}`);
    console.log(`📱 =====================================`);

    // Send SMS when admin verifies payment
    if (donation.donorPhone && !donation.isAnonymous) {
      try {
        const { sendDonationThankYouSMS } = await import("../utils/fast2smsSender.js");
        const phoneForSMS = donation.donorPhone.replace(/^\+/, '').trim();
        const nameForSMS = donation.donorName && donation.donorName.trim() ? donation.donorName.trim() : "Donor";
        
        // Get campaign title
        const Campaign = (await import("../models/Campaign.js")).default;
        const campaign = await Campaign.findById(donation.campaignId);
        const campaignTitle = campaign ? campaign.title : "Campaign";
        
        console.log(`📱 Admin verified payment! Sending confirmation SMS to: ${phoneForSMS}`);
        console.log(`   Donation ID: ${donation._id}, Amount: ₹${donation.amount}`);
        console.log(`   Name: ${nameForSMS}, Campaign: ${campaignTitle}`);
        
        const smsResult = await sendDonationThankYouSMS(phoneForSMS, nameForSMS, donation.amount, campaignTitle);
        
        if (smsResult.success) {
          console.log(`✅ Payment confirmation SMS sent successfully to ${phoneForSMS}`);
        } else if (smsResult.isLimitReached) {
          console.log(`⚠️ SMS daily limit reached (10/day). Payment verified, SMS will be sent tomorrow.`);
        } else {
          console.log(`⚠️ Payment SMS failed: ${smsResult.error}`);
        }
      } catch (smsError) {
        console.error("❌ Error sending payment confirmation SMS:", smsError);
        console.error("❌ Error stack:", smsError.stack);
        // Don't fail payment verification if SMS fails
      }
    } else {
      if (!donation.donorPhone) {
        console.log(`📱 SMS not sent: No phone number provided for donation ${donation._id}`);
      } else if (donation.isAnonymous) {
        console.log(`📱 SMS not sent: Anonymous donation ${donation._id}`);
      }
    }

    res.json({
      success: true,
      message: "Payment marked as verified",
      payment: donation,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify payment",
      error: error.message,
    });
  }
};

// Flag payment as suspicious
export const flagPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.adminId;

    const donation = await Donation.findById(id);
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    donation.isSuspicious = true;
    donation.flaggedBy = adminId;
    donation.flaggedAt = new Date();
    if (reason) {
      donation.suspiciousReason = donation.suspiciousReason 
        ? `${donation.suspiciousReason}; Admin: ${reason}`
        : `Admin: ${reason}`;
    }
    donation.riskLevel = "high";

    await donation.save();

    res.json({
      success: true,
      message: "Payment flagged as suspicious",
      payment: donation,
    });
  } catch (error) {
    console.error("Error flagging payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to flag payment",
      error: error.message,
    });
  }
};

// Review payment (mark as reviewed)
export const reviewPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewNotes, isSuspicious, riskLevel } = req.body;
    const adminId = req.adminId;

    const donation = await Donation.findById(id);
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    donation.reviewedBy = adminId;
    donation.reviewedAt = new Date();
    if (reviewNotes) donation.reviewNotes = reviewNotes;
    if (isSuspicious !== undefined) donation.isSuspicious = isSuspicious;
    if (riskLevel) donation.riskLevel = riskLevel;

    await donation.save();

    res.json({
      success: true,
      message: "Payment reviewed",
      payment: donation,
    });
  } catch (error) {
    console.error("Error reviewing payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to review payment",
      error: error.message,
    });
  }
};

// Reject payment
export const rejectPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const adminId = req.adminId;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const donation = await Donation.findById(id);
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    donation.adminRejected = true;
    donation.rejectionReason = rejectionReason;
    donation.paymentStatus = "cancelled";
    donation.reviewedBy = adminId;
    donation.reviewedAt = new Date();

    // Revert campaign raised amount
    const campaign = await Campaign.findById(donation.campaignId);
    if (campaign) {
      campaign.raisedAmount = Math.max(0, campaign.raisedAmount - donation.amount);
      await campaign.save();
    }

    await donation.save();

    res.json({
      success: true,
      message: "Payment rejected",
      payment: donation,
    });
  } catch (error) {
    console.error("Error rejecting payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject payment",
      error: error.message,
    });
  }
};

// Get suspicious payments
export const getSuspiciousPayments = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {
      $or: [
        { isSuspicious: true },
        { riskLevel: { $in: ["high", "critical"] } },
        { fraudScore: { $gte: 50 } },
      ],
    };

    const [donations, total] = await Promise.all([
      Donation.find(query)
        .populate("donorId", "name email phone")
        .populate("campaignId", "title beneficiaryName")
        .sort({ fraudScore: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Donation.countDocuments(query),
    ]);

    res.json({
      success: true,
      payments: donations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching suspicious payments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load suspicious payments",
      error: error.message,
    });
  }
};

// Export payments to CSV/Excel
export const exportPayments = async (req, res) => {
  try {
    const { startDate, endDate, paymentStatus } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    const donations = await Donation.find(query)
      .populate("donorId", "name email phone")
      .populate("campaignId", "title")
      .sort({ createdAt: -1 })
      .lean();

    // Convert to CSV format
    const csvHeaders = [
      "Receipt Number",
      "Donor Name",
      "Donor Email",
      "Campaign",
      "Amount",
      "Payment Status",
      "Payment Method",
      "Risk Level",
      "Fraud Score",
      "Suspicious",
      "Date",
      "IP Address",
    ];

    const csvRows = donations.map((d) => [
      d.receiptNumber || "N/A",
      d.donorId?.name || "Anonymous",
      d.donorId?.email || "N/A",
      d.campaignId?.title || "N/A",
      d.amount,
      d.paymentStatus,
      d.paymentMethod,
      d.riskLevel,
      d.fraudScore || 0,
      d.isSuspicious ? "Yes" : "No",
      new Date(d.createdAt).toLocaleString(),
      d.ipAddress || "N/A",
    ]);

    const csv = [
      csvHeaders.join(","),
      ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=payments-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error("Error exporting payments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export payments",
      error: error.message,
    });
  }
};
export const approveAllForCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { adminId } = req.admin;
  } catch (error) {
    console.error("Error approving all for campaign:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve all for campaign",
      error: error.message,
    });
  }
};
export const rejectAllForCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;  
    const { adminId } = req.admin;
  } catch (error) {
    console.error("Error rejecting all for campaign:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject all for campaign",
      error: error.message,
    });
  }
};