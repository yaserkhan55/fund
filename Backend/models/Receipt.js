import mongoose from "mongoose";

const receiptSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
    },
    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donation",
      required: true,
      unique: true,
    },
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
    // Donor Information
    donorName: {
      type: String,
      required: true,
    },
    donorEmail: {
      type: String,
      required: true,
    },
    donorPhone: {
      type: String,
      default: "",
    },
    // Campaign Information
    campaignTitle: {
      type: String,
      required: true,
    },
    beneficiaryName: {
      type: String,
      required: true,
    },
    // Payment Details
    amount: {
      type: Number,
      required: true,
    },
    transactionFee: {
      type: Number,
      default: 0,
    },
    netAmount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentId: {
      type: String,
      default: "",
    },
    // Receipt File
    pdfUrl: {
      type: String,
      default: "",
    },
    pdfPath: {
      type: String,
      default: "",
    },
    // Email Status
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
    // Tax Information (for 80G certificates if applicable)
    isTaxDeductible: {
      type: Boolean,
      default: false,
    },
    taxCertificateUrl: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
receiptSchema.index({ receiptNumber: 1 });
receiptSchema.index({ donorId: 1, createdAt: -1 });
receiptSchema.index({ campaignId: 1 });

export default mongoose.model("Receipt", receiptSchema);

