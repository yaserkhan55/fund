// controllers/campaignController.js
import Campaign from "../models/Campaign.js";
import User from "../models/User.js";
import { notifyOwner } from "../utils/notifyOwner.js";
import { clerkClient } from "@clerk/express";
import mongoose from "mongoose";

/* =====================================================
   ADMIN: GET ALL CAMPAIGNS
===================================================== */
export const adminGetAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      campaigns
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================================
   PUBLIC: GET ONLY APPROVED CAMPAIGNS (Homepage)
===================================================== */
export const getApprovedCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ status: "approved" })
      .sort({ createdAt: -1 });

    res.json({ success: true, campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================================
   PUBLIC: GET PLATFORM STATISTICS
===================================================== */
export const getPlatformStats = async (req, res) => {
  try {
    // Get total approved campaigns
    const totalCampaigns = await Campaign.countDocuments({ status: "approved" });
    
    // Get total raised amount across all approved campaigns
    const campaigns = await Campaign.find({ status: "approved" }).select("raisedAmount");
    const totalRaised = campaigns.reduce((sum, c) => sum + (Number(c.raisedAmount) || 0), 0);
    
    // Get total contributors (from donations - we'll need to check if Donation model exists)
    // For now, estimate based on campaigns (each campaign might have multiple donors)
    // This is a placeholder - you can enhance this with actual donation data
    const estimatedContributors = Math.floor(totalCampaigns * 50); // Rough estimate
    
    // Calculate lives saved (estimate: each campaign helps ~1-3 people on average)
    const estimatedLivesSaved = Math.floor(totalCampaigns * 1.2);
    
    res.json({
      success: true,
      stats: {
        livesSaved: estimatedLivesSaved,
        contributors: estimatedContributors,
        trustedCampaigns: totalCampaigns,
        totalRaised: totalRaised,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================================
   PUBLIC: GET FEATURED/URGENT CAMPAIGNS
===================================================== */
export const getFeaturedCampaigns = async (req, res) => {
  try {
    const { limit = 6, sortBy = "urgent" } = req.query;
    
    let sortCriteria = {};
    
    if (sortBy === "urgent") {
      // Sort by lowest progress percentage (most urgent)
      const campaigns = await Campaign.find({ status: "approved" })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit) * 2); // Get more to calculate progress
      
      const withProgress = campaigns.map(c => ({
        ...c.toObject(),
        progress: c.goalAmount > 0 
          ? (c.raisedAmount / c.goalAmount) * 100 
          : 0
      }));
      
      // Sort by lowest progress (most urgent)
      withProgress.sort((a, b) => a.progress - b.progress);
      
      return res.json({
        success: true,
        campaigns: withProgress.slice(0, parseInt(limit))
      });
    } else if (sortBy === "trending") {
      // Sort by highest raised amount recently
      sortCriteria = { raisedAmount: -1, createdAt: -1 };
    } else if (sortBy === "newest") {
      sortCriteria = { createdAt: -1 };
    } else {
      sortCriteria = { createdAt: -1 };
    }
    
    const campaigns = await Campaign.find({ status: "approved" })
      .sort(sortCriteria)
      .limit(parseInt(limit));
    
    res.json({ success: true, campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================================
   PUBLIC: GET ALL CAMPAIGNS
===================================================== */
export const getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.json({ success: true, campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================================
   PUBLIC: SINGLE CAMPAIGN
===================================================== */
export const getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found"
      });
    }

    res.json({ success: true, campaign });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================================
   USER'S OWN CAMPAIGNS (Clerk user)
===================================================== */
export const getMyCampaigns = async (req, res) => {
  try {
    const clerkUserId = req.auth?.userId;

    if (!clerkUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Prefer MongoDB user provided by sync middleware
    let mongoUser = req.mongoUser;

    if (!mongoUser) {
      mongoUser = await User.findOne({ clerkId: clerkUserId });
    }
    
    if (!mongoUser) {
      console.log(`⚠️ No MongoDB user found for Clerk ID: ${clerkUserId}`);
      return res.json({ success: true, campaigns: [] });
    }

    const mongoUserId = mongoUser._id.toString();

    // Find campaigns - use $in to handle both ObjectId and string, and remove duplicates
    const campaigns = await Campaign.find({
      $or: [
        { owner: mongoUser._id },
        { owner: mongoUserId },
        { createdBy: mongoUser._id },
        { createdBy: mongoUserId }
      ]
    })
    .sort({ createdAt: -1 })
    .lean();

    // Remove duplicates by _id (in case same campaign matches multiple conditions)
    const uniqueCampaigns = campaigns.filter((campaign, index, self) => 
      index === self.findIndex((c) => c._id.toString() === campaign._id.toString())
    );

    console.log(`Found ${uniqueCampaigns.length} unique campaigns for user ${mongoUser.email} (MongoDB ID: ${mongoUserId}, Clerk ID: ${clerkUserId})`);
    
    // Log campaigns with infoRequests for debugging
    const campaignsWithRequests = uniqueCampaigns.filter(c => c.infoRequests && c.infoRequests.length > 0);
    if (campaignsWithRequests.length > 0) {
      console.log(`Found ${campaignsWithRequests.length} campaigns with infoRequests`);
      campaignsWithRequests.forEach(c => {
        console.log(`Campaign ${c.title} has ${c.infoRequests.length} requests`);
      });
    }

    res.json({ success: true, campaigns: uniqueCampaigns });

  } catch (error) {
    console.error("Error in getMyCampaigns:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================================
   GET SINGLE CAMPAIGN (OWNER VIEW)
===================================================== */
export const getCampaignForOwner = async (req, res) => {
  try {
    const clerkUserId = req.auth?.userId;

    if (!clerkUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let mongoUser = req.mongoUser;

    if (!mongoUser) {
      mongoUser = await User.findOne({ clerkId: clerkUserId });
    }

    if (!mongoUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const campaign = await Campaign.findOne({
      _id: req.params.id,
      $or: [{ owner: mongoUser._id }, { createdBy: mongoUser._id }, { owner: mongoUser._id.toString() }],
    }).lean();

    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    return res.json({ success: true, campaign });
  } catch (error) {
    console.error("Error fetching campaign for owner:", error);
    return res.status(500).json({ success: false, message: "Failed to load campaign" });
  }
};

/* =====================================================
   RESPOND TO ADMIN INFO REQUEST
===================================================== */
export const respondToInfoRequest = async (req, res) => {
  try {
    const clerkUserId = req.auth?.userId;

    if (!clerkUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let mongoUser = req.mongoUser;
    if (!mongoUser) {
      mongoUser = await User.findOne({ clerkId: clerkUserId });
    }

    if (!mongoUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { id, requestId } = req.params;
    const note = (req.body?.note || "").trim();
    const uploadedDocs = Array.isArray(req.files)
      ? req.files.map(
          (file) => file.secure_url || file.path || file.url || `/uploads/${file.filename}`
        )
      : [];

    if (!uploadedDocs.length && !note) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one document or add a note for the admin.",
      });
    }

    const campaign = await Campaign.findOne({ _id: id, owner: mongoUser._id });

    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    const request = campaign.infoRequests?.id(requestId);

    if (!request) {
      return res.status(404).json({ success: false, message: "Admin request not found" });
    }

    const responsePayload = {
      note,
      documents: uploadedDocs,
      uploadedAt: new Date(),
      uploadedBy: mongoUser._id,
      uploadedByName: mongoUser.name || mongoUser.email,
    };

    if (!Array.isArray(request.responses)) {
      request.responses = [];
    }
    request.responses.push(responsePayload);
    request.status = "submitted";
    request.respondedAt = new Date();

    if (uploadedDocs.length) {
      campaign.documents = Array.isArray(campaign.documents) ? campaign.documents : [];
      campaign.medicalDocuments = Array.isArray(campaign.medicalDocuments)
        ? campaign.medicalDocuments
        : [];
      campaign.documents.push(...uploadedDocs);
      campaign.medicalDocuments.push(...uploadedDocs);
    }

    await campaign.save();

    const plainCampaign = campaign.toObject();
    const plainRequest = request.toObject ? request.toObject() : request;

    return res.json({
      success: true,
      message: "Documents sent to admin for review",
      request: plainRequest,
      campaign: plainCampaign,
    });
  } catch (error) {
    console.error("Error responding to info request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit documents",
    });
  }
};

/* =====================================================
   UPDATE CAMPAIGN (OWNER)
===================================================== */
export const updateCampaignByOwner = async (req, res) => {
  try {
    const clerkUserId = req.auth?.userId;

    if (!clerkUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let mongoUser = req.mongoUser;
    if (!mongoUser) {
      mongoUser = await User.findOne({ clerkId: clerkUserId });
    }

    if (!mongoUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const campaign = await Campaign.findOne({
      _id: req.params.id,
      $or: [{ owner: mongoUser._id }, { createdBy: mongoUser._id }, { owner: mongoUser._id.toString() }],
    });

    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    const editableFields = [
      "title",
      "shortDescription",
      "fullStory",
      "goalAmount",
      "category",
      "beneficiaryName",
      "city",
      "relation",
      "zakatEligible",
      "educationQualification",
      "employmentStatus",
      "duration",
    ];

    editableFields.forEach((field) => {
      if (typeof req.body[field] !== "undefined") {
        if (["goalAmount", "duration"].includes(field)) {
          campaign[field] = Number(req.body[field]) || 0;
        } else if (field === "zakatEligible") {
          campaign[field] = req.body[field] === "true" || req.body[field] === true;
        } else {
          campaign[field] = req.body[field];
        }
      }
    });

    if (req.files?.image?.length) {
      const img = req.files.image[0];
      campaign.image = img.secure_url || img.path || img.url || campaign.image;
    }

    const newDocs =
      req.files?.documents?.map(
        (doc) => doc.secure_url || doc.path || doc.url || `/uploads/${doc.filename}`
      ) || [];

    if (newDocs.length) {
      campaign.documents = Array.isArray(campaign.documents) ? campaign.documents : [];
      campaign.medicalDocuments = Array.isArray(campaign.medicalDocuments)
        ? campaign.medicalDocuments
        : [];
      campaign.documents.push(...newDocs);
      campaign.medicalDocuments.push(...newDocs);
    }

    await campaign.save();

    return res.json({ success: true, campaign });
  } catch (error) {
    console.error("Error updating campaign:", error);
    return res.status(500).json({ success: false, message: "Failed to update campaign" });
  }
};

/* =====================================================
   MARK ADMIN ACTION AS VIEWED
===================================================== */
export const markAdminActionAsViewed = async (req, res) => {
  try {
    const { campaignId, actionId } = req.params;
    const clerkUserId = req.auth?.userId;

    if (!clerkUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let mongoUser = req.mongoUser;
    if (!mongoUser) {
      mongoUser = await User.findOne({ clerkId: clerkUserId });
    }

    if (!mongoUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const campaign = await Campaign.findOne({
      _id: campaignId,
      owner: mongoUser._id,
    });

    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    // Find and update the specific admin action
    const adminAction = campaign.adminActions.id(actionId);
    if (!adminAction) {
      return res.status(404).json({ success: false, message: "Action not found" });
    }

    adminAction.viewed = true;
    await campaign.save();

    return res.json({ success: true, message: "Action marked as viewed" });
  } catch (error) {
    console.error("Error marking admin action as viewed:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================================
   GET USER NOTIFICATIONS
===================================================== */
export const getUserNotifications = async (req, res) => {
  try {
    const clerkUserId = req.auth?.userId;

    if (!clerkUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let mongoUser = req.mongoUser;
    if (!mongoUser) {
      mongoUser = await User.findOne({ clerkId: clerkUserId });
    }

    if (!mongoUser) {
      return res.json({ success: true, notifications: [], unreadCount: 0 });
    }

    const mongoUserId = mongoUser._id.toString();

    // Get all campaigns owned by user
    const campaigns = await Campaign.find({
      $or: [
        { owner: mongoUserId },
        { owner: mongoUser._id },
        { createdBy: mongoUserId }
      ]
    }).lean();

    // Collect all notifications
    const notifications = [];

    campaigns.forEach((campaign) => {
      // Admin actions (approve/reject/delete)
      if (Array.isArray(campaign.adminActions)) {
        campaign.adminActions.forEach((action) => {
          // Only include unviewed admin actions
          if (!action.viewed) {
            notifications.push({
              id: action._id.toString(),
              type: "admin_action",
              campaignId: campaign._id.toString(),
              campaignTitle: campaign.title,
              action: action.action,
              message: action.message || `${action.action} by admin`,
              createdAt: action.createdAt,
              viewed: false,
            });
          }
        });
      }

      // Admin info requests
      if (Array.isArray(campaign.infoRequests)) {
        campaign.infoRequests.forEach((request) => {
          // Only include pending + unviewed info requests
          if (request.status === "pending" && !request.viewed) {
            notifications.push({
              id: request._id.toString(),
              type: "info_request",
              campaignId: campaign._id.toString(),
              campaignTitle: campaign.title,
              message: request.message || "Admin requested additional information",
              createdAt: request.createdAt,
              viewed: false,
            });
          }
        });
      }
    });

    // Contact query notifications (admin replies)
    const Contact = (await import("../models/Contact.js")).default;
    
    try {
      // SIMPLIFIED APPROACH: Find ALL contacts with admin replies, then filter by user
      // This ensures we don't miss any contacts due to missing userId/clerkId
      const allContactsWithReplies = await Contact.find({
        conversation: { 
          $exists: true, 
          $ne: [],
          $elemMatch: { sender: "admin" } // Has at least one admin message
        }
      })
      .sort({ updatedAt: -1 })
      .limit(100) // Get more contacts to filter
      .lean();

      console.log(`[Notifications] Found ${allContactsWithReplies.length} total contacts with admin replies`);

      // Filter contacts that belong to this user
      const userEmail = mongoUser.email?.toLowerCase().trim();
      const userContacts = allContactsWithReplies.filter(contact => {
        // Match by email (case insensitive)
        if (userEmail && contact.email) {
          if (contact.email.toLowerCase().trim() === userEmail) {
            return true;
          }
        }
        
        // Match by userId
        if (mongoUser._id && contact.userId) {
          if (contact.userId.toString() === mongoUser._id.toString()) {
            return true;
          }
        }
        
        // Match by clerkId
        if (clerkUserId && contact.clerkId) {
          if (contact.clerkId === clerkUserId) {
            return true;
          }
        }
        
        return false;
      });

      console.log(`[Notifications] Filtered to ${userContacts.length} contacts for user (email: ${mongoUser.email}, userId: ${mongoUser._id}, clerkId: ${clerkUserId})`);

      // Update contacts with user info if they match by email
      for (const contact of userContacts) {
        if (contact.email && (!contact.userId || !contact.clerkId)) {
          try {
            await Contact.updateOne(
              { _id: contact._id },
              { 
                $set: { 
                  userId: mongoUser._id,
                  clerkId: clerkUserId 
                } 
              }
            );
            console.log(`[Notifications] Updated contact ${contact._id} with user info`);
          } catch (err) {
            console.error(`[Notifications] Error updating contact:`, err);
          }
        }
      }

      // Process each contact and create notifications
      userContacts.forEach((contact) => {
        if (!contact.conversation || !Array.isArray(contact.conversation)) {
          console.log(`[Notifications] Contact ${contact._id} has no conversation array`);
          return;
        }
        
        // Get all admin messages from conversation
        const adminMessages = contact.conversation.filter(msg => msg && msg.sender === "admin");
        
        console.log(`[Notifications] Contact ${contact._id} (email: ${contact.email}) has ${adminMessages.length} admin messages`);
        
        if (adminMessages.length > 0) {
          // Get the latest admin message
          const latestAdminMsg = adminMessages.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA;
          })[0];
          
          // Show if it's recent (within last 60 days) and has a message
          const msgDate = new Date(latestAdminMsg.createdAt);
          const daysAgo = (Date.now() - msgDate.getTime()) / (1000 * 60 * 60 * 24);
          
          console.log(`[Notifications] Latest admin message for contact ${contact._id}: daysAgo=${daysAgo.toFixed(1)}, hasMessage=${!!latestAdminMsg.message}, message="${latestAdminMsg.message?.substring(0, 30)}..."`);
          
          if (daysAgo <= 60 && latestAdminMsg.message && latestAdminMsg.message.trim()) {
            const notificationId = `contact_${contact._id}_${latestAdminMsg.createdAt}`;
            const notification = {
              id: notificationId,
              type: "contact_reply",
              contactId: contact._id.toString(),
              message: latestAdminMsg.message.trim(),
              createdAt: latestAdminMsg.createdAt,
              viewed: false,
            };
            notifications.push(notification);
            console.log(`[Notifications] ✅ ADDED contact notification: "${latestAdminMsg.message.substring(0, 50)}..." (ID: ${notificationId})`);
          } else {
            console.log(`[Notifications] ❌ Skipped: daysAgo=${daysAgo.toFixed(1)} (max 60), hasMessage=${!!latestAdminMsg.message}, trimmed="${latestAdminMsg.message?.trim()}"`);
          }
        }
      });

      console.log(`[Notifications] Total contact notifications added: ${notifications.filter(n => n.type === "contact_reply").length}`);
    } catch (error) {
      console.error("[Notifications] Error fetching contact notifications:", error);
      console.error("[Notifications] Error stack:", error.stack);
    }

    // Sort by date (newest first)
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // All returned notifications are unread
    const unreadCount = notifications.length;
    
    const contactReplyCount = notifications.filter(n => n.type === "contact_reply").length;
    console.log(`[Notifications] ===== FINAL RESULT =====`);
    console.log(`[Notifications] Total notifications: ${notifications.length}`);
    console.log(`[Notifications] Contact reply notifications: ${contactReplyCount}`);
    console.log(`[Notifications] Unread count: ${unreadCount}`);
    if (contactReplyCount > 0) {
      console.log(`[Notifications] Contact reply details:`, notifications.filter(n => n.type === "contact_reply").map(n => ({
        id: n.id,
        message: n.message.substring(0, 50),
        createdAt: n.createdAt
      })));
    }
    console.log(`[Notifications] ========================`);

    return res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================================
   MARK ALL USER NOTIFICATIONS AS VIEWED
===================================================== */
export const markAllNotificationsAsViewed = async (req, res) => {
  try {
    const clerkUserId = req.auth?.userId;

    if (!clerkUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let mongoUser = req.mongoUser;
    if (!mongoUser) {
      mongoUser = await User.findOne({ clerkId: clerkUserId });
    }

    if (!mongoUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const mongoUserId = mongoUser._id.toString();

    // Find all campaigns owned by user
    const campaigns = await Campaign.find({
      $or: [
        { owner: mongoUserId },
        { owner: mongoUser._id },
        { createdBy: mongoUserId }
      ]
    });

    let updatedCount = 0;

    for (const campaign of campaigns) {
      let hasChanges = false;

      // Mark admin actions as viewed
      if (Array.isArray(campaign.adminActions)) {
        campaign.adminActions.forEach((action) => {
          if (!action.viewed) {
            action.viewed = true;
            hasChanges = true;
            updatedCount += 1;
          }
        });
      }

      // Mark info requests as viewed (without changing their status)
      if (Array.isArray(campaign.infoRequests)) {
        campaign.infoRequests.forEach((request) => {
          if (request.status === "pending" && !request.viewed) {
            request.viewed = true;
            hasChanges = true;
            updatedCount += 1;
          }
        });
      }

      if (hasChanges) {
        await campaign.save();
      }
    }

    return res.json({
      success: true,
      message: "Notifications marked as viewed",
      updated: updatedCount,
    });
  } catch (error) {
    console.error("Error marking notifications as viewed:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================================
   CREATE CAMPAIGN
===================================================== */
export const createCampaign = async (req, res) => {
  try {
    const clerkUserId = req.auth?.userId;

    if (!clerkUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    // Ensure user exists in MongoDB (sync Clerk user)
    let mongoUser = req.mongoUser;

    if (!mongoUser) {
      mongoUser = await User.findOne({ 
        $or: [
          { clerkId: clerkUserId },
          { email: req.auth?.sessionClaims?.email }
        ]
      });
    }

    if (!mongoUser) {
      try {
        // Fetch user details from Clerk
        const clerkUser = await clerkClient.users.getUser(clerkUserId);
        
        const email = clerkUser.emailAddresses?.[0]?.emailAddress || 
                     req.auth?.sessionClaims?.email || 
                     `${clerkUserId}@clerk-user.com`;
        
        const name = clerkUser.firstName && clerkUser.lastName
          ? `${clerkUser.firstName} ${clerkUser.lastName}`
          : clerkUser.firstName || 
            clerkUser.username || 
            email.split('@')[0] ||
            "User";

        // Check if email already exists
        const existingByEmail = await User.findOne({ email: email.toLowerCase() });
        
        if (existingByEmail) {
          existingByEmail.clerkId = clerkUserId;
          existingByEmail.picture = clerkUser.imageUrl || existingByEmail.picture;
          await existingByEmail.save();
          mongoUser = existingByEmail;
          console.log(`✅ Synced existing user with Clerk ID: ${email}`);
        } else {
          mongoUser = await User.create({
            name,
            email: email.toLowerCase(),
            clerkId: clerkUserId,
            picture: clerkUser.imageUrl || "",
            provider: "clerk",
            password: "clerk-auth",
            role: "user"
          });
          console.log(`✅ Created new MongoDB user from Clerk: ${email} (ID: ${mongoUser._id})`);
        }
      } catch (clerkError) {
        console.error("Error syncing Clerk user:", clerkError);
        // Fallback: create minimal user
        const email = req.auth?.sessionClaims?.email || `${clerkUserId}@clerk-user.com`;
        mongoUser = await User.create({
          name: "User",
          email: email.toLowerCase(),
          clerkId: clerkUserId,
          provider: "clerk",
          password: "clerk-auth",
          role: "user"
        });
        console.log(`✅ Created fallback MongoDB user for Clerk ID: ${clerkUserId}`);
      }
    }

    // Use MongoDB ObjectId directly (not string)
    const userId = mongoUser._id;

    const {
      title,
      shortDescription,
      fullStory,
      goalAmount,
      category,
      beneficiaryName,
      city,
      relation,
      zakatEligible,
      zakatCategory,
      islamicAffirmation,
      educationQualification,
      employmentStatus,
      duration
    } = req.body;

    // Validate required fields
    if (!title || !shortDescription || !fullStory || !goalAmount || !beneficiaryName || !city || !relation) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: title, shortDescription, fullStory, goalAmount, beneficiaryName, city, and relation are required."
      });
    }

    // Zakat validation
    if (zakatEligible === "true" || zakatEligible === true) {
      if (!islamicAffirmation || islamicAffirmation === "false") {
        return res.status(400).json({
          success: false,
          message: "Islamic affirmation is required for Zakat-eligible campaigns."
        });
      }
      if (!zakatCategory) {
        return res.status(400).json({
          success: false,
          message: "Please select a Zakat category for this campaign."
        });
      }
    }

    // Validate goal amount
    const goal = Number(goalAmount);
    if (goal < 2000) {
      return res.status(400).json({
        success: false,
        message: "Minimum goal amount is ₹2,000."
      });
    }
    if (goal > 10000000) {
      return res.status(400).json({
        success: false,
        message: "Maximum goal amount is ₹1,00,00,000."
      });
    }

    // Validate duration
    const campaignDuration = duration ? Number(duration) : null;
    if (campaignDuration && (campaignDuration < 7 || campaignDuration > 365)) {
      return res.status(400).json({
        success: false,
        message: "Campaign duration must be between 7 and 365 days."
      });
    }

    // Set default category if missing
    const finalCategory = category || "medical";

    // Handle file uploads - Cloudinary returns secure_url in the file object
    let image = null;
    let documents = [];

    if (req.files) {
      // Image file
      if (req.files.image && req.files.image.length > 0) {
        const imgFile = req.files.image[0];
        // Cloudinary returns secure_url or path
        image = imgFile.secure_url || imgFile.path || imgFile.url;
        console.log(`📷 Image uploaded: ${image}`);
      }

      // Document files
      if (req.files.documents && req.files.documents.length > 0) {
        documents = req.files.documents.map((doc) => {
          return doc.secure_url || doc.path || doc.url;
        });
        console.log(`📄 Documents uploaded: ${documents.length} files`);
      }
    }

    console.log(`📦 Files received:`, {
      hasFiles: !!req.files,
      imageCount: req.files?.image?.length || 0,
      documentCount: req.files?.documents?.length || 0,
      image: image,
      documents: documents
    });

    if (!documents.length) {
      return res.status(400).json({
        success: false,
        message: "At least one medical document is required.",
      });
    }

    // Ensure status is explicitly set and owner is ObjectId
    const campaignData = {
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      fullStory: fullStory.trim(),
      goalAmount: goal,
      category: finalCategory,
      beneficiaryName: beneficiaryName.trim(),
      city: city.trim(),
      relation: relation.trim(),
      zakatEligible: zakatEligible === "true" || zakatEligible === true,
      zakatCategory: zakatCategory || "",
      islamicAffirmation: islamicAffirmation === "true" || islamicAffirmation === true,
      educationQualification: educationQualification || "",
      employmentStatus: employmentStatus || "",
      duration: campaignDuration,
      image,
      documents,
      owner: userId, // MongoDB ObjectId (not string)
      status: "pending", // Explicitly set to pending
      isApproved: false // Explicitly set to false
    };

    console.log(`📝 Creating campaign with data:`, {
      title: campaignData.title,
      owner: campaignData.owner,
      ownerType: typeof campaignData.owner,
      ownerIsObjectId: campaignData.owner instanceof mongoose.Types.ObjectId,
      status: campaignData.status,
      isApproved: campaignData.isApproved,
      userEmail: mongoUser.email,
      userName: mongoUser.name
    });

    const campaign = await Campaign.create(campaignData);

    // Verify campaign was created correctly by fetching it fresh from DB
    const verifyCampaign = await Campaign.findById(campaign._id)
      .populate("owner", "name email clerkId provider")
      .lean();
    
    if (!verifyCampaign) {
      console.error(`❌ Campaign creation failed - campaign not found after creation!`);
      return res.status(500).json({
        success: false,
        message: "Campaign creation failed - verification error"
      });
    }

    console.log(`✅ New campaign created: ${campaign._id} - ${campaign.title}`);
    console.log(`   Owner (MongoDB ID): ${userId}`);
    console.log(`   Owner (Clerk ID): ${clerkUserId}`);
    console.log(`   Status: ${verifyCampaign.status}, isApproved: ${verifyCampaign.isApproved}`);
    console.log(`   User Email: ${mongoUser.email}, User Name: ${mongoUser.name}`);
    console.log(`   Campaign verified in DB: Status=${verifyCampaign.status}, isApproved=${verifyCampaign.isApproved}`);
    console.log(`   Owner populated: ${verifyCampaign.owner ? 'Yes' : 'No'}`);

    await notifyOwner({
      ownerId: userId,
      overrideName: campaign?.beneficiaryName,
    });

    res.json({ success: true, campaign });

  } catch (error) {
    console.error("❌ Error creating campaign:", error);
    console.error("Error stack:", error.stack);
    console.error("Request body:", req.body);
    console.error("Request files:", req.files);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to create campaign",
      error: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

