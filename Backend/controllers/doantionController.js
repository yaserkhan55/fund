import Campaign from "../models/Campaign.js";
import Donation from "../models/Donation.js";

export const createDonation = async (req, res) => {
  try {
    const { campaignId, amount, name, phone } = req.body;

    if (!campaignId || !amount || !name || !phone) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found.",
      });
    }

    // Save donation
    const donation = new Donation({
      campaignId,
      amount,
      name,
      phone,
    });

    // Generate unique receipt number before saving
    donation.generateReceiptNumber();
    await donation.save();

    // Update campaign raised amount
    campaign.raisedAmount += Number(amount);
    await campaign.save();

    return res.status(201).json({
      success: true,
      message: "Donation successful.",
      donation,
    });
  } catch (error) {
    console.error("Donation Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error.",
      error: error.message,
    });
  }
};

// Fraud Detection Helper Functions
const calculateFraudScore = async (donorId, amount, ipAddress, campaignId) => {
  let fraudScore = 0;
  const reasons = [];
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Check donation frequency from same donor
  const recentDonationsFromDonor = await Donation.countDocuments({
    donorId,
    createdAt: { $gte: last24Hours },
  });

  if (recentDonationsFromDonor >= 10) {
    fraudScore += 30;
    reasons.push("Too many donations in last 24 hours");
  } else if (recentDonationsFromDonor >= 5) {
    fraudScore += 15;
    reasons.push("High donation frequency");
  }

  // Check donation frequency from same IP
  const recentDonationsFromIP = await Donation.countDocuments({
    ipAddress,
    createdAt: { $gte: last24Hours },
  });

  if (recentDonationsFromIP >= 20) {
    fraudScore += 40;
    reasons.push("Too many donations from same IP address");
  } else if (recentDonationsFromIP >= 10) {
    fraudScore += 20;
    reasons.push("Multiple donations from same IP");
  }

  // Check for duplicate amounts
  const duplicateAmount = await Donation.findOne({
    donorId,
    amount: Number(amount),
    createdAt: { $gte: last24Hours },
  });

  if (duplicateAmount) {
    fraudScore += 10;
    reasons.push("Duplicate donation amount detected");
  }

  // Check for unusually high amounts
  const avgDonation = await Donation.aggregate([
    { $match: { campaignId } },
    { $group: { _id: null, avg: { $avg: "$amount" } } },
  ]);

  if (avgDonation.length > 0 && Number(amount) > avgDonation[0].avg * 10) {
    fraudScore += 25;
    reasons.push("Unusually high donation amount");
  }

  // Check for very low amounts (potential spam)
  if (Number(amount) < 10 && recentDonationsFromDonor >= 3) {
    fraudScore += 15;
    reasons.push("Multiple small donations (potential spam)");
  }

  // Determine risk level
  let riskLevel = "low";
  if (fraudScore >= 70) riskLevel = "critical";
  else if (fraudScore >= 50) riskLevel = "high";
  else if (fraudScore >= 30) riskLevel = "medium";

  return { fraudScore, riskLevel, reasons, recentDonationsFromDonor, recentDonationsFromIP };
};

// Guest donation endpoint (no authentication required)
export const commitGuestDonation = async (req, res) => {
  try {
    const { campaignId, amount, message, isAnonymous, donorName, donorEmail, donorPhone } = req.body;

    // Get IP address and user agent
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress || "";
    const userAgent = req.headers["user-agent"] || "";

    if (!campaignId || !amount || amount < 1) {
      return res.status(400).json({
        success: false,
        message: "Campaign ID and valid amount are required.",
      });
    }

    // Validate amount
    if (Number(amount) > 1000000) {
      return res.status(400).json({
        success: false,
        message: "Donation amount exceeds maximum limit of ₹10,00,000. Please contact support for large donations.",
      });
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found.",
      });
    }

    // Fraud Detection - Use IP and email for guest donations
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Check donation frequency from same IP
    const recentDonationsFromIP = await Donation.countDocuments({
      ipAddress,
      createdAt: { $gte: last24Hours },
    });

    // Check donation frequency from same email (if provided)
    let recentDonationsFromEmail = 0;
    if (donorEmail) {
      recentDonationsFromEmail = await Donation.countDocuments({
        donorEmail: donorEmail.toLowerCase(),
        createdAt: { $gte: last24Hours },
      });
    }

    // Calculate fraud score
    let fraudScore = 0;
    const reasons = [];
    
    if (recentDonationsFromIP >= 20) {
      fraudScore += 40;
      reasons.push("Too many donations from same IP address");
    } else if (recentDonationsFromIP >= 10) {
      fraudScore += 20;
      reasons.push("Multiple donations from same IP");
    }

    if (recentDonationsFromEmail >= 10) {
      fraudScore += 30;
      reasons.push("Too many donations from same email");
    }

    // Check for duplicate amounts from same IP
    const duplicateAmount = await Donation.findOne({
      ipAddress,
      amount: Number(amount),
      createdAt: { $gte: last24Hours },
    });

    if (duplicateAmount) {
      fraudScore += 10;
      reasons.push("Duplicate donation amount detected");
    }

    // Check for unusually high amounts
    const avgDonation = await Donation.aggregate([
      { $match: { campaignId } },
      { $group: { _id: null, avg: { $avg: "$amount" } } },
    ]);

    if (avgDonation.length > 0 && Number(amount) > avgDonation[0].avg * 10) {
      fraudScore += 25;
      reasons.push("Unusually high donation amount");
    }

    // Determine risk level
    let riskLevel = "low";
    if (fraudScore >= 70) riskLevel = "critical";
    else if (fraudScore >= 50) riskLevel = "high";
    else if (fraudScore >= 30) riskLevel = "medium";

    // Check if donation should be blocked
    if (fraudScore >= 80) {
      return res.status(403).json({
        success: false,
        message: "Donation flagged for review. Please contact support.",
        flagged: true,
        reason: reasons.join(", "),
      });
    }

    // Get last donation time for velocity check (by IP)
    const lastDonation = await Donation.findOne({ ipAddress }).sort({ createdAt: -1 });
    const timeSinceLastDonation = lastDonation 
      ? Math.floor((Date.now() - new Date(lastDonation.createdAt).getTime()) / 1000)
      : 999999;

    // Velocity check - prevent donations within 30 seconds from same IP
    if (timeSinceLastDonation < 30) {
      return res.status(429).json({
        success: false,
        message: "Please wait before making another donation.",
        retryAfter: 30 - timeSinceLastDonation,
      });
    }

    // Create guest donation (no donorId)
    const donation = new Donation({
      donorId: null, // No authentication required
      campaignId,
      amount: Number(amount),
      message: message || "",
      isAnonymous: isAnonymous || false,
      donorName: donorName || (isAnonymous ? "Anonymous" : ""),
      donorEmail: donorEmail ? donorEmail.toLowerCase() : "",
      paymentStatus: "pending",
      paymentMethod: "commitment",
      // Fraud detection fields
      ipAddress,
      userAgent,
      fraudScore,
      riskLevel,
      isSuspicious: fraudScore >= 50,
      suspiciousReason: reasons.join("; "),
      donationCountFromIP: recentDonationsFromIP + 1,
      donationCountFromDonor: recentDonationsFromEmail + 1,
      timeSinceLastDonation,
      amountAnomaly: reasons.some(r => r.includes("high donation amount") || r.includes("small donations")),
      velocityCheck: timeSinceLastDonation < 300,
    });

    // Generate unique receipt number before saving
    donation.generateReceiptNumber();
    await donation.save();

    // Update campaign raised amount
    campaign.raisedAmount += Number(amount);
    await campaign.save();

    // If suspicious, log for admin review
    if (donation.isSuspicious) {
      console.warn(`⚠️ Suspicious donation detected: ${donation._id}, Score: ${donation.fraudScore}, Risk: ${donation.riskLevel}`);
    }

    // Send WhatsApp thank you message (if phone number provided and not anonymous)
    if (donorPhone && !isAnonymous && donorName) {
      try {
        const { sendTwilioDonationThankYou } = await import("../utils/twilioWhatsAppSender.js");
        const formattedPhone = donorPhone.startsWith('+') ? donorPhone : `+${donorPhone}`;
        await sendTwilioDonationThankYou(formattedPhone, donorName, Number(amount), campaign.title);
        console.log(`✅ WhatsApp thank you sent to ${formattedPhone}`);
      } catch (whatsappError) {
        // Don't block donation flow if WhatsApp fails
        console.log("WhatsApp notification optional - donation still successful:", whatsappError.message);
      }
    }

    // Send SMS thank you message (if phone number provided and not anonymous)
    if (donorPhone && !isAnonymous) {
      try {
        const { sendDonationThankYouSMS } = await import("../utils/fast2smsSender.js");
        // Fast2SMS expects phone without + prefix
        const phoneForSMS = donorPhone.replace(/^\+/, '').trim();
        // Use donor name if provided, otherwise use "Donor"
        const nameForSMS = donorName && donorName.trim() ? donorName.trim() : "Donor";
        
        console.log(`📱 Attempting to send SMS to: ${phoneForSMS}, Name: ${nameForSMS}, Amount: ${amount}`);
        
        const smsResult = await sendDonationThankYouSMS(phoneForSMS, nameForSMS, Number(amount), campaign.title);
        
        if (smsResult.success) {
          console.log(`✅ SMS thank you sent successfully to ${phoneForSMS}`);
        } else if (smsResult.isLimitReached) {
          // Daily limit reached - log but don't fail donation
          console.log(`⚠️ SMS daily limit reached (10/day). Donation successful, SMS will be sent tomorrow.`);
        } else {
          console.log(`⚠️ SMS failed: ${smsResult.error}. Donation still successful.`);
        }
      } catch (smsError) {
        // Don't block donation flow if SMS fails
        console.error("SMS notification error:", smsError);
        console.log("SMS notification optional - donation still successful:", smsError.message);
      }
    } else {
      // Log why SMS wasn't sent
      if (!donorPhone) {
        console.log("📱 SMS not sent: No phone number provided");
      } else if (isAnonymous) {
        console.log("📱 SMS not sent: Anonymous donation");
      }
    }

    return res.status(201).json({
      success: true,
      message: "Donation commitment recorded successfully. You will be contacted for payment processing.",
      donation: {
        id: donation._id,
        amount: donation.amount,
        paymentStatus: donation.paymentStatus,
        createdAt: donation.createdAt,
        requiresReview: donation.isSuspicious,
        receiptNumber: donation.receiptNumber,
      },
    });
  } catch (error) {
    console.error("Guest Donation Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to commit donation.",
      error: error.message,
    });
  }
};

// Keep original commitDonation for authenticated users (if needed later)
export const commitDonation = async (req, res) => {
  try {
    const { campaignId, amount, message, isAnonymous } = req.body;
    const donorId = req.donorId; // From donorAuth middleware

    // Get IP address and user agent
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress || "";
    const userAgent = req.headers["user-agent"] || "";

    if (!campaignId || !amount || amount < 1) {
      return res.status(400).json({
        success: false,
        message: "Campaign ID and valid amount are required.",
      });
    }

    // Validate amount
    if (Number(amount) > 1000000) {
      return res.status(400).json({
        success: false,
        message: "Donation amount exceeds maximum limit of ₹10,00,000. Please contact support for large donations.",
      });
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found.",
      });
    }

    // Fraud Detection
    const fraudCheck = await calculateFraudScore(donorId, amount, ipAddress, campaignId);
    
    // Check if donation should be blocked
    if (fraudCheck.fraudScore >= 80) {
      return res.status(403).json({
        success: false,
        message: "Donation flagged for review. Please contact support.",
        flagged: true,
        reason: fraudCheck.reasons.join(", "),
      });
    }

    // Get last donation time for velocity check
    const lastDonation = await Donation.findOne({ donorId }).sort({ createdAt: -1 });
    const timeSinceLastDonation = lastDonation 
      ? Math.floor((Date.now() - new Date(lastDonation.createdAt).getTime()) / 1000)
      : 999999;

    // Velocity check - prevent donations within 30 seconds
    if (timeSinceLastDonation < 30) {
      return res.status(429).json({
        success: false,
        message: "Please wait before making another donation.",
        retryAfter: 30 - timeSinceLastDonation,
      });
    }

    // Create donation commitment with fraud detection data
    const donation = new Donation({
      donorId,
      campaignId,
      amount: Number(amount),
      message: message || "",
      isAnonymous: isAnonymous || false,
      paymentStatus: "pending",
      paymentMethod: "commitment",
      // Fraud detection fields
      ipAddress,
      userAgent,
      fraudScore: fraudCheck.fraudScore,
      riskLevel: fraudCheck.riskLevel,
      isSuspicious: fraudCheck.fraudScore >= 50,
      suspiciousReason: fraudCheck.reasons.join("; "),
      donationCountFromIP: fraudCheck.recentDonationsFromIP + 1,
      donationCountFromDonor: fraudCheck.recentDonationsFromDonor + 1,
      timeSinceLastDonation,
      amountAnomaly: fraudCheck.reasons.some(r => r.includes("high donation amount") || r.includes("small donations")),
      velocityCheck: timeSinceLastDonation < 300, // Less than 5 minutes
    });

    // Generate unique receipt number before saving
    donation.generateReceiptNumber();
    await donation.save();

    // Update campaign raised amount (as committed, not yet paid)
    campaign.raisedAmount += Number(amount);
    await campaign.save();

    // If suspicious, log for admin review
    if (donation.isSuspicious) {
      console.warn(`⚠️ Suspicious donation detected: ${donation._id}, Score: ${donation.fraudScore}, Risk: ${donation.riskLevel}`);
    }

    return res.status(201).json({
      success: true,
      message: "Donation commitment recorded successfully. You will be contacted for payment processing.",
      donation: {
        id: donation._id,
        amount: donation.amount,
        paymentStatus: donation.paymentStatus,
        createdAt: donation.createdAt,
        requiresReview: donation.isSuspicious,
      },
    });
  } catch (error) {
    console.error("Donation Commit Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to commit donation.",
      error: error.message,
    });
  }
};

export const getCampaignDonations = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const donations = await Donation.find({ campaignId }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      donations,
    });
  } catch (err) {
    console.error("Fetch Donation Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error.",
      error: err.message,
    });
  }
};

// Get all committed payments for admin (legacy - keeping for backward compatibility)
export const getCommittedPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "", status = "all" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query for committed payments
    const query = {
      paymentMethod: "commitment",
      paymentStatus: { $in: ["pending", "processing"] }
    };

    // Filter by status
    if (status !== "all") {
      query.paymentStatus = status;
    }

    // Add search filter
    if (search) {
      query.$or = [
        { donorName: { $regex: search, $options: "i" } },
        { donorEmail: { $regex: search, $options: "i" } },
        { receiptNumber: { $regex: search, $options: "i" } },
      ];
    }

    const [donations, total] = await Promise.all([
      Donation.find(query)
        .populate({
          path: "campaignId",
          select: "title beneficiaryName category",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Donation.countDocuments(query),
    ]);

    return res.json({
      success: true,
      donations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("Get Committed Payments Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch committed payments.",
      error: err.message,
    });
  }
};

// Get all donations for admin with comprehensive filters
export const getAllDonationsAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      status = "all",
      paymentMethod = "all",
      campaignId = "",
      dateFrom = "",
      dateTo = "",
      minAmount = "",
      maxAmount = "",
      riskLevel = "all",
      isSuspicious = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};

    // Status filter
    if (status !== "all") {
      query.paymentStatus = status;
    }

    // Payment method filter
    if (paymentMethod !== "all") {
      query.paymentMethod = paymentMethod;
    }

    // Campaign filter
    if (campaignId) {
      query.campaignId = campaignId;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.createdAt.$lte = new Date(dateTo);
      }
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) {
        query.amount.$gte = Number(minAmount);
      }
      if (maxAmount) {
        query.amount.$lte = Number(maxAmount);
      }
    }

    // Risk level filter
    if (riskLevel !== "all") {
      query.riskLevel = riskLevel;
    }

    // Suspicious filter
    if (isSuspicious !== "") {
      query.isSuspicious = isSuspicious === "true";
    }

    // Search filter
    if (search) {
      query.$or = [
        { donorName: { $regex: search, $options: "i" } },
        { donorEmail: { $regex: search, $options: "i" } },
        { receiptNumber: { $regex: search, $options: "i" } },
        { razorpayOrderId: { $regex: search, $options: "i" } },
        { razorpayPaymentId: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [donations, total] = await Promise.all([
      Donation.find(query)
        .populate({
          path: "campaignId",
          select: "title beneficiaryName category goalAmount currentAmount",
        })
        .populate({
          path: "donorId",
          select: "name email phone",
          options: { strictPopulate: false },
        })
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Donation.countDocuments(query),
    ]);

    // Find and attach User account information for each donation by matching email
    const User = (await import("../models/User.js")).default;
    for (const donation of donations) {
      if (donation.donorEmail) {
        const user = await User.findOne({ email: donation.donorEmail.toLowerCase() }).lean();
        if (user) {
          donation.accountHolder = {
            name: user.name,
            email: user.email,
            clerkId: user.clerkId,
            provider: user.provider,
          };
        }
      }
    }

    return res.json({
      success: true,
      donations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("Get All Donations Admin Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch donations.",
      error: err.message,
    });
  }
};

// Get donation statistics for admin
export const getDonationStats = async (req, res) => {
  try {
    const { dateFrom = "", dateTo = "" } = req.query;
    const dateFilter = {};
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {};
      if (dateFrom) dateFilter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.createdAt.$lte = new Date(dateTo);
    }

    const [
      totalDonations,
      totalAmount,
      pendingCount,
      successCount,
      failedCount,
      committedCount,
      suspiciousCount,
      donationsByStatus,
      donationsByMethod,
      topCampaigns,
      recentDonations,
    ] = await Promise.all([
      Donation.countDocuments(dateFilter),
      Donation.aggregate([
        { $match: { ...dateFilter, paymentStatus: "success" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Donation.countDocuments({ ...dateFilter, paymentStatus: "pending" }),
      Donation.countDocuments({ ...dateFilter, paymentStatus: "success" }),
      Donation.countDocuments({ ...dateFilter, paymentStatus: "failed" }),
      Donation.countDocuments({ ...dateFilter, paymentMethod: "commitment" }),
      Donation.countDocuments({ ...dateFilter, isSuspicious: true }),
      Donation.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$paymentStatus", count: { $sum: 1 } } },
      ]),
      Donation.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$paymentMethod", count: { $sum: 1 } } },
      ]),
      Donation.aggregate([
        { $match: { ...dateFilter, paymentStatus: "success" } },
        {
          $group: {
            _id: "$campaignId",
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "campaigns",
            localField: "_id",
            foreignField: "_id",
            as: "campaign",
          },
        },
        { $unwind: "$campaign" },
        {
          $project: {
            campaignTitle: "$campaign.title",
            totalAmount: 1,
            count: 1,
          },
        },
      ]),
      Donation.find(dateFilter)
        .populate("campaignId", "title")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    return res.json({
      success: true,
      stats: {
        totalDonations,
        totalAmount: totalAmount[0]?.total || 0,
        pendingCount,
        successCount,
        failedCount,
        committedCount,
        suspiciousCount,
        donationsByStatus: donationsByStatus.reduce((acc, item) => {
          acc[item._id || "unknown"] = item.count;
          return acc;
        }, {}),
        donationsByMethod: donationsByMethod.reduce((acc, item) => {
          acc[item._id || "unknown"] = item.count;
          return acc;
        }, {}),
        topCampaigns,
        recentDonations,
      },
    });
  } catch (err) {
    console.error("Get Donation Stats Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch donation statistics.",
      error: err.message,
    });
  }
};

// Update donation status (mark as paid, verify, etc.)
export const updateDonationStatus = async (req, res) => {
  try {
    const { donationId } = req.params;
    const { paymentStatus, paymentReceived, adminVerified, reviewNotes, paymentNotes } = req.body;
    const adminId = req.adminId || req.admin?.id;

    const update = {};
    const adminAction = {};
    
    if (paymentStatus) update.paymentStatus = paymentStatus;
    if (paymentReceived !== undefined) {
      update.paymentReceived = paymentReceived;
      if (paymentReceived) {
        update.paymentReceivedAt = new Date();
        update.paymentVerifiedBy = adminId;
        // Add admin action for approval
        adminAction.action = "approved";
        adminAction.message = `Your donation of ₹${req.body.amount || 'N/A'} has been approved and payment received. Thank you for your contribution!`;
        adminAction.createdAt = new Date();
        adminAction.viewed = false;
      }
    }
    if (adminVerified !== undefined) {
      update.adminVerified = adminVerified;
      update.reviewedBy = adminId;
      update.reviewedAt = new Date();
    }
    if (reviewNotes !== undefined) update.reviewNotes = reviewNotes;
    if (paymentNotes !== undefined) update.paymentNotes = paymentNotes;
    
    // Handle rejection
    if (req.body.adminRejected) {
      update.adminRejected = true;
      update.rejectionReason = req.body.rejectionReason || "Payment not received";
      update.paymentStatus = "failed";
      adminAction.action = "rejected";
      adminAction.message = `Your donation commitment of ₹${req.body.amount || 'N/A'} has been rejected. Reason: ${update.rejectionReason}`;
      adminAction.createdAt = new Date();
      adminAction.viewed = false;
    }

    // Get donation first to get amount
    const existingDonation = await Donation.findById(donationId).lean();
    if (existingDonation && adminAction.action) {
      // Update message with actual amount
      if (adminAction.action === "approved") {
        adminAction.message = `Your donation of ₹${existingDonation.amount.toLocaleString('en-IN')} has been approved and payment received. Thank you for your contribution!`;
      } else {
        adminAction.message = `Your donation commitment of ₹${existingDonation.amount.toLocaleString('en-IN')} has been rejected. Reason: ${update.rejectionReason || "Payment not received"}`;
      }
    }

    const updateQuery = { $set: update };
    if (adminAction.action) {
      updateQuery.$push = { adminActions: adminAction };
    }

    const donation = await Donation.findByIdAndUpdate(
      donationId,
      updateQuery,
      { new: true }
    )
      .populate("campaignId", "title beneficiaryName")
      .lean();

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found.",
      });
    }

    // Send SMS when admin approves committed payment
    // Trigger when: paymentStatus is "completed"/"success" OR paymentReceived is true
    const isPaymentApproved = 
      paymentStatus === "completed" || 
      paymentStatus === "success" || 
      (paymentReceived === true && donation.paymentStatus !== "failed");
    
    if (isPaymentApproved) {
      try {
        const { sendDonationThankYouSMS } = await import("../utils/fast2smsSender.js");
        
        if (donation.donorPhone && !donation.isAnonymous) {
          const phoneForSMS = donation.donorPhone.replace(/^\+/, '').trim();
          const nameForSMS = donation.donorName && donation.donorName.trim() ? donation.donorName.trim() : "Donor";
          const campaignTitle = donation.campaignId?.title || "Campaign";
          
          console.log(`📱 Admin approved payment! Sending confirmation SMS to: ${phoneForSMS}`);
          console.log(`   Donation ID: ${donation._id}, Amount: ₹${donation.amount}`);
          
          const smsResult = await sendDonationThankYouSMS(phoneForSMS, nameForSMS, donation.amount, campaignTitle);
          
          if (smsResult.success) {
            console.log(`✅ Payment confirmation SMS sent successfully to ${phoneForSMS}`);
          } else if (smsResult.isLimitReached) {
            console.log(`⚠️ SMS daily limit reached (10/day). Payment approved, SMS will be sent tomorrow.`);
          } else {
            console.log(`⚠️ Payment SMS failed: ${smsResult.error}`);
          }
        } else {
          if (!donation.donorPhone) {
            console.log(`📱 SMS not sent: No phone number provided for donation ${donation._id}`);
          } else if (donation.isAnonymous) {
            console.log(`📱 SMS not sent: Anonymous donation ${donation._id}`);
          }
        }
      } catch (smsError) {
        console.error("Error sending payment confirmation SMS:", smsError);
        // Don't fail the approval if SMS fails
      }
    }

    return res.json({
      success: true,
      donation,
      message: "Donation updated successfully.",
    });
  } catch (err) {
    console.error("Update Donation Status Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update donation.",
      error: err.message,
    });
  }
};

// Flag donation as suspicious
export const flagDonation = async (req, res) => {
  try {
    const { donationId } = req.params;
    const { reason } = req.body;
    const adminId = req.adminId || req.admin?.id;

    const donation = await Donation.findByIdAndUpdate(
      donationId,
      {
        $set: {
          isSuspicious: true,
          flaggedBy: adminId,
          flaggedAt: new Date(),
          suspiciousReason: reason || donation.suspiciousReason || "Flagged by admin",
        },
      },
      { new: true }
    ).lean();

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found.",
      });
    }

    return res.json({
      success: true,
      donation,
      message: "Donation flagged successfully.",
    });
  } catch (err) {
    console.error("Flag Donation Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to flag donation.",
      error: err.message,
    });
  }
};

// Get single donation details
export const getDonationDetails = async (req, res) => {
  try {
    const { donationId } = req.params;

    const donation = await Donation.findById(donationId)
      .populate({
        path: "campaignId",
        select: "title beneficiaryName category goalAmount currentAmount description images",
      })
      .populate({
        path: "donorId",
        select: "name email phone",
        options: { strictPopulate: false },
      })
      .lean();

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found.",
      });
    }

    // Find and attach User account information if email matches
    if (donation.donorEmail) {
      const User = (await import("../models/User.js")).default;
      const user = await User.findOne({ email: donation.donorEmail.toLowerCase() }).lean();
      if (user) {
        donation.accountHolder = {
          name: user.name,
          email: user.email,
          clerkId: user.clerkId,
          provider: user.provider,
        };
      }
    }

    return res.json({
      success: true,
      donation,
    });
  } catch (err) {
    console.error("Get Donation Details Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch donation details.",
      error: err.message,
    });
  }
};
