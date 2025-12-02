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
    const { campaignId, amount, message, isAnonymous, donorName, donorEmail } = req.body;

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
