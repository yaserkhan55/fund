// === Fixed Notifications Controller (Extracted from above) ===
// This file contains ONLY the corrected getUserNotifications and markAllNotificationsAsViewed
// so you can directly replace them in your campaignController.

import Campaign from "../models/Campaign.js";
import User from "../models/User.js";
import Contact from "../models/Contact.js";
import Donation from "../models/Donation.js";

/* =============================================
   GET USER NOTIFICATIONS (FULLY FIXED & CLEAN)
============================================= */
export const getUserNotifications = async (req, res) => {
  try {
    const clerkUserId = req.auth?.userId;
    if (!clerkUserId) return res.status(401).json({ success: false, message: "Unauthorized" });

    let mongoUser = req.mongoUser || await User.findOne({ clerkId: clerkUserId });
    if (!mongoUser) return res.json({ success: true, notifications: [], unreadCount: 0 });

    const mongoUserId = mongoUser._id.toString();
    const userEmail = mongoUser.email?.toLowerCase().trim();

    const notifications = [];

    /* =============================================
       1. CAMPAIGN-BASED NOTIFICATIONS
    ============================================= */
    const campaigns = await Campaign.find({
      $or: [
        { owner: mongoUserId },
        { owner: mongoUser._id },
        { createdBy: mongoUserId }
      ]
    }).lean();

    campaigns.forEach((campaign) => {
      // Admin actions (approval / rejection / deletion)
      if (Array.isArray(campaign.adminActions)) {
        campaign.adminActions.forEach((action) => {
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

      // Info requests
      if (Array.isArray(campaign.infoRequests)) {
        campaign.infoRequests.forEach((req) => {
          if (req.status === "pending" && !req.viewed) {
            notifications.push({
              id: req._id.toString(),
              type: "info_request",
              campaignId: campaign._id.toString(),
              campaignTitle: campaign.title,
              message: req.message || "Admin requested more information",
              createdAt: req.createdAt,
              viewed: false,
            });
          }
        });
      }
    });

    /* =============================================
       2. CONTACT FORM (ADMIN REPLIES)
    ============================================= */
    const contacts = await Contact.find({
      email: userEmail,
      conversation: { $exists: true, $ne: [] }
    }).lean();

    contacts.forEach((c) => {
      if (!Array.isArray(c.conversation)) return;
      const adminMsgs = c.conversation.filter((msg) => msg.sender === "admin");
      if (!adminMsgs.length) return;

      const latest = adminMsgs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

      notifications.push({
        id: `contact_${c._id}`,
        type: "contact_reply",
        message: latest.message,
        contactId: c._id.toString(),
        createdAt: latest.createdAt,
        viewed: false,
      });
    });

    /* =============================================
       3. DONATION ACTIONS
    ============================================= */
    if (userEmail) {
      const donations = await Donation.find({
        donorEmail: userEmail,
        adminActions: { $exists: true, $ne: [] }
      })
        .populate("campaignId", "title")
        .lean();

      donations.forEach((donation) => {
        donation.adminActions?.forEach((action) => {
          if (!action.viewed) {
            notifications.push({
              id: `${donation._id}_${action._id || action.createdAt}`,
              type: "donation_action",
              donationId: donation._id.toString(),
              campaignId: donation.campaignId?._id?.toString() || "",
              campaignTitle: donation.campaignId?.title || "Campaign",
              message: action.message,
              action: action.action,
              amount: donation.amount,
              createdAt: action.createdAt,
              viewed: false,
            });
          }
        });
      });
    }

    /* =============================================
       FINALIZE
    ============================================= */
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({
      success: true,
      notifications,
      unreadCount: notifications.length,
    });
  } catch (error) {
    console.error("Notifications error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* =============================================
   MARK ALL AS VIEWED (CLEAN + FIXED)
============================================= */
export const markAllNotificationsAsViewed = async (req, res) => {
  try {
    const clerkUserId = req.auth?.userId;
    if (!clerkUserId) return res.status(401).json({ success: false, message: "Unauthorized" });

    let mongoUser = req.mongoUser || await User.findOne({ clerkId: clerkUserId });
    if (!mongoUser) return res.status(404).json({ success: false, message: "User not found" });

    const mongoUserId = mongoUser._id.toString();

    const campaigns = await Campaign.find({
      $or: [
        { owner: mongoUserId },
        { owner: mongoUser._id },
        { createdBy: mongoUserId }
      ]
    });

    let updated = 0;

    for (const campaign of campaigns) {
      let changed = false;

      campaign.adminActions?.forEach((a) => {
        if (!a.viewed) {
          a.viewed = true;
          updated++;
          changed = true;
        }
      });

      campaign.infoRequests?.forEach((r) => {
        if (r.status === "pending" && !r.viewed) {
          r.viewed = true;
          updated++;
          changed = true;
        }
      });

      if (changed) await campaign.save();
    }

    // Mark contact replies
    await Contact.updateMany(
      { email: mongoUser.email },
      { $set: { "conversation.$[msg].viewed": true } },
      { arrayFilters: [{ "msg.sender": "admin" }] }
    );

    // Mark donation notifications
    await Donation.updateMany(
      { donorEmail: mongoUser.email },
      { $set: { "adminActions.$[].viewed": true } }
    );

    return res.json({ success: true, message: "All notifications marked as viewed", updated });
  } catch (error) {
    console.error("Mark viewed error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
