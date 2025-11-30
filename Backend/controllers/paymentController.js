import Donation from "../models/Donation.js";
import Campaign from "../models/Campaign.js";
import CampaignWallet from "../models/CampaignWallet.js";
import Donor from "../models/Donor.js";
import { createOrder, verifyPaymentSignature, getPaymentDetails } from "../config/razorpay.js";

// ✅ CREATE PAYMENT ORDER
export const createPaymentOrder = async (req, res) => {
  try {
    const { campaignId, amount, message, isAnonymous } = req.body;
    const donorId = req.donorId;

    console.log("[Create Order] Request received:", { campaignId, amount, donorId });

    // Validation
    if (!campaignId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Campaign ID and amount are required",
      });
    }

    if (amount < 1) {
      return res.status(400).json({
        success: false,
        message: "Donation amount must be at least ₹1",
      });
    }

    if (!donorId) {
      return res.status(401).json({
        success: false,
        message: "Donor authentication required",
      });
    }

    // Check if campaign exists and is approved
    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Allow donations even if not approved (for testing)
    // if (campaign.status !== "approved" || !campaign.isApproved) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "This campaign is not approved for donations",
    //   });
    // }

    // Check if campaign goal is reached
    if (campaign.raisedAmount >= campaign.goalAmount) {
      return res.status(400).json({
        success: false,
        message: "Campaign goal has been reached",
      });
    }

    // Get donor
    const donor = await Donor.findById(donorId);

    if (!donor) {
      console.error("[Create Order] Donor not found:", donorId);
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    // Calculate transaction fee (2% platform fee)
    const transactionFee = Math.round((amount * 0.02) * 100) / 100;
    const netAmount = amount - transactionFee;

    console.log("[Create Order] Creating donation record...");

    // Create donation record (pending)
    let donation;
    try {
      donation = await Donation.create({
        donorId,
        campaignId,
        amount,
        transactionFee,
        netAmount,
        paymentStatus: "pending",
        message: message || "",
        isAnonymous: isAnonymous || false,
        donorName: donor.name,
        donorEmail: donor.email,
        donorPhone: donor.phone,
        ipAddress: req.ip || req.headers["x-forwarded-for"] || "",
        userAgent: req.headers["user-agent"] || "",
      });

      // Generate receipt number
      donation.generateReceiptNumber();
      await donation.save();
      console.log("[Create Order] Donation created:", donation._id);
    } catch (dbError) {
      console.error("[Create Order] Database error:", dbError);
      return res.status(500).json({
        success: false,
        message: "Failed to create donation record",
        error: dbError.message,
      });
    }

    // Create Razorpay order
    try {
      console.log("[Create Order] Creating Razorpay order...");
      const order = await createOrder(amount, "INR", donation.receiptNumber);
      console.log("[Create Order] Razorpay order created:", order.id);

      // Update donation with order ID
      donation.razorpayOrderId = order.id;
      await donation.save();

      res.json({
        success: true,
        message: "Payment order created successfully",
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
        },
        donation: {
          id: donation._id,
          receiptNumber: donation.receiptNumber,
          amount: donation.amount,
          transactionFee: donation.transactionFee,
          netAmount: donation.netAmount,
        },
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      });
    } catch (razorpayError) {
      console.error("[Create Order] Razorpay error:", razorpayError);
      donation.paymentStatus = "failed";
      await donation.save();

      return res.status(500).json({
        success: false,
        message: "Failed to create payment order",
        error: razorpayError.message || "Razorpay configuration error",
        details: process.env.RAZORPAY_KEY_ID ? "Razorpay credentials found" : "Razorpay credentials missing",
      });
    }
  } catch (error) {
    console.error("[Create Order] Unexpected error:", error);
    console.error("[Create Order] Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create payment order",
      error: error.toString(),
    });
  }
};

// ✅ VERIFY PAYMENT
export const verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature, donationId } = req.body;

    if (!orderId || !paymentId || !signature || !donationId) {
      return res.status(400).json({
        success: false,
        message: "Order ID, Payment ID, Signature, and Donation ID are required",
      });
    }

    // Verify signature
    const isValidSignature = verifyPaymentSignature(orderId, paymentId, signature);

    if (!isValidSignature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // Get donation
    const donation = await Donation.findById(donationId);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found",
      });
    }

    // Check if already processed
    if (donation.paymentStatus === "success") {
      return res.json({
        success: true,
        message: "Payment already verified",
        donation,
      });
    }

    // Verify order ID matches
    if (donation.razorpayOrderId !== orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID mismatch",
      });
    }

    // Get payment details from Razorpay
    const paymentDetails = await getPaymentDetails(paymentId);

    // Update donation
    donation.razorpayPaymentId = paymentId;
    donation.razorpaySignature = signature;
    donation.paymentId = paymentId;
    donation.paymentStatus = "success";
    donation.paymentMethod = paymentDetails.method || "razorpay";
    await donation.save();

    // Update campaign raised amount
    const campaign = await Campaign.findById(donation.campaignId);
    if (campaign) {
      campaign.raisedAmount += donation.amount;
      campaign.contributors = (campaign.contributors || 0) + 1;
      await campaign.save();
    }

    // Update or create campaign wallet
    let wallet = await CampaignWallet.findOne({ campaignId: donation.campaignId });
    if (!wallet) {
      wallet = await CampaignWallet.create({
        campaignId: donation.campaignId,
        balance: 0,
        totalReceived: 0,
        totalWithdrawn: 0,
      });
    }

    // Add funds to wallet
    await wallet.addFunds(
      donation.netAmount,
      donation._id,
      `Donation from ${donation.donorName}`
    );

    // Update donor stats
    const donor = await Donor.findById(donation.donorId);
    if (donor) {
      donor.totalDonated += donation.amount;
      donor.totalDonations += 1;
      donor.lastDonationAt = new Date();
      await donor.save();
    }

    // TODO: Generate receipt PDF
    // TODO: Send receipt email
    // TODO: Send notification to campaign owner

    res.json({
      success: true,
      message: "Payment verified successfully",
      donation: {
        id: donation._id,
        receiptNumber: donation.receiptNumber,
        amount: donation.amount,
        netAmount: donation.netAmount,
        paymentStatus: donation.paymentStatus,
        createdAt: donation.createdAt,
      },
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to verify payment",
    });
  }
};

// ✅ GET DONOR DONATIONS
export const getDonorDonations = async (req, res) => {
  try {
    const donorId = req.donorId;
    const { page = 1, limit = 10 } = req.query;

    const donations = await Donation.find({ donorId })
      .populate("campaignId", "title image shortDescription beneficiaryName")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Donation.countDocuments({ donorId });

    res.json({
      success: true,
      donations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get donor donations error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get donations",
    });
  }
};

