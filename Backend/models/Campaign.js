import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    shortDescription: { type: String, required: true },
    fullStory: { type: String, required: true },

    goalAmount: { type: Number, required: true },
    raisedAmount: { type: Number, default: 0 },
    category: { type: String, required: true },

    beneficiaryName: { type: String, required: true },
    city: { type: String, required: true },
    relation: { type: String, required: true },

    zakatEligible: { type: Boolean, default: false },

    // NEW FIELDS (User Input)
    educationQualification: { type: String, default: "" },
    employmentStatus: { type: String, default: "" },
    duration: { type: Number, default: null }, // days

    // Cover image
    image: { type: String },

    // NEW: Multiple images for carousel (like Ketto)
    imageGallery: [{ type: String }],
    patientImages: [{ type: String }],

    // NEW: Documents (medical files, prescriptions, bills)
    medicalDocuments: [{ type: String }],
    documents: [{ type: String }],

    // NEW: About section (separate from fullStory)
    aboutSection: { type: String, default: "" },
    about: { type: String, default: "" },

    // Owner reference (better than string)
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Status (Admin control)
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    isApproved: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },

    // NEW: timestamp when admin approves
    approvedAt: { type: Date, default: null },

    // NEW: campaign auto-expire (optional use later)
    endDate: { type: Date, default: null },

    // Admin <> campaigner review loop
    requiresMoreInfo: { type: Boolean, default: false },
    lastInfoRequestAt: { type: Date, default: null },
    infoRequests: [
      {
        // Notification-style admin info requests to campaign owner
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        status: {
          type: String,
          enum: ["pending", "submitted", "resolved"],
          default: "pending",
        },
        // Track whether campaigner has seen this request in the UI
        viewed: { type: Boolean, default: false },
        requestedBy: { type: String, default: "admin" },
        respondedAt: { type: Date, default: null },
        resolvedAt: { type: Date, default: null },
        resolvedBy: { type: String, default: null },
        responses: [
          {
            note: { type: String, default: "" },
            documents: [{ type: String }],
            uploadedAt: { type: Date, default: Date.now },
            uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            uploadedByName: { type: String, default: "" },
          },
        ],
      },
    ],
    // Admin actions notifications (approve/reject/delete)
    adminActions: [
      {
        action: {
          type: String,
          enum: ["approved", "rejected", "deleted"],
          required: true,
        },
        createdAt: { type: Date, default: Date.now },
        message: { type: String, default: "" },
        viewed: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Campaign", campaignSchema);
