// controllers/adminController.js

import User from "../models/User.js";
import Campaign from "../models/Campaign.js";
import Donation from "../models/Donation.js";
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