import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
  {
    // Donor reference (separate from campaign creators)
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donor",
      required: true,
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, "Donation amount must be at least ₹1"],
    },
    // Payment Gateway Fields
    paymentId: {
      type: String,
      default: "",
    },
    razorpayOrderId: {
      type: String,
      default: "",
    },
    razorpayPaymentId: {
      type: String,
      default: "",
    },
    razorpaySignature: {
      type: String,
      default: "",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "processing", "success", "failed", "refunded", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["razorpay", "stripe", "upi", "card", "netbanking", "wallet", "commitment"],
      default: "razorpay",
    },
    // Receipt
    receiptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Receipt",
      default: null,
    },
    receiptNumber: {
      type: String,
      default: "",
      unique: true,
      sparse: true,
    },
    // Donor Information (for anonymous donations)
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    donorName: {
      type: String,
      default: "",
    },
    donorEmail: {
      type: String,
      default: "",
    },
    donorPhone: {
      type: String,
      default: "",
    },
    // Message/Comment from donor
    message: {
      type: String,
      default: "",
      maxlength: [500, "Message cannot exceed 500 characters"],
    },
    // Transaction Details
    transactionFee: {
      type: Number,
      default: 0, // Platform fee
    },
    netAmount: {
      type: Number,
      default: 0, // Amount after fees
    },
    // Refund Information
    refunded: {
      type: Boolean,
      default: false,
    },
    refundedAt: {
      type: Date,
      default: null,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundReason: {
      type: String,
      default: "",
    },
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Admin who processed refund
    },
    // Fraud Detection & Anti-Scam Features
    isSuspicious: {
      type: Boolean,
      default: false,
    },
    suspiciousReason: {
      type: String,
      default: "",
    },
    fraudScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100, // 0 = safe, 100 = highly suspicious
    },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
    },
    flaggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Admin who flagged this
      default: null,
    },
    flaggedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Admin who reviewed this
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewNotes: {
      type: String,
      default: "",
    },
    // Rate Limiting & Spam Prevention
    ipAddress: {
      type: String,
      default: "",
      index: true,
    },
    userAgent: {
      type: String,
      default: "",
    },
    deviceFingerprint: {
      type: String,
      default: "",
      index: true,
    },
    donationCountFromIP: {
      type: Number,
      default: 1, // Count of donations from this IP in last 24h
    },
    donationCountFromDonor: {
      type: Number,
      default: 1, // Count of donations from this donor in last 24h
    },
    timeSinceLastDonation: {
      type: Number,
      default: 0, // Seconds since last donation from this donor
    },
    // Pattern Detection
    isDuplicate: {
      type: Boolean,
      default: false,
    },
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donation",
      default: null,
    },
    amountAnomaly: {
      type: Boolean,
      default: false, // True if amount is unusually high/low
    },
    velocityCheck: {
      type: Boolean,
      default: false, // True if too many donations too quickly
    },
    // Admin Actions
    adminVerified: {
      type: Boolean,
      default: false,
    },
    adminRejected: {
      type: Boolean,
      default: false,
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    // Payment Tracking
    paymentReceived: {
      type: Boolean,
      default: false,
    },
    paymentReceivedAt: {
      type: Date,
      default: null,
    },
    paymentVerifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    paymentNotes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Generate receipt number
donationSchema.methods.generateReceiptNumber = function () {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  this.receiptNumber = `RCP-${timestamp}-${random}`;
  return this.receiptNumber;
};

// Indexes for better query performance
donationSchema.index({ donorId: 1, createdAt: -1 });
donationSchema.index({ campaignId: 1, createdAt: -1 });
donationSchema.index({ paymentStatus: 1 });
donationSchema.index({ razorpayOrderId: 1 });
donationSchema.index({ receiptNumber: 1 });
donationSchema.index({ ipAddress: 1, createdAt: -1 });
donationSchema.index({ isSuspicious: 1, riskLevel: 1 });
donationSchema.index({ fraudScore: -1 });
donationSchema.index({ adminVerified: 1 });
donationSchema.index({ paymentReceived: 1 });

export default mongoose.model("Donation", donationSchema);
