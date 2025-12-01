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
    // Fraud Detection
    isSuspicious: {
      type: Boolean,
      default: false,
    },
    suspiciousReason: {
      type: String,
      default: "",
    },
    ipAddress: {
      type: String,
      default: "",
    },
    userAgent: {
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

export default mongoose.model("Donation", donationSchema);
