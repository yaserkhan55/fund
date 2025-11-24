import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    shortDescription: { type: String, required: true },
    fullStory: { type: String, required: true },

    goalAmount: { type: Number, required: true },
    category: { type: String, required: true },

    beneficiaryName: { type: String, required: true },
    city: { type: String, required: true },
    relation: { type: String, required: true },

    zakatEligible: { type: Boolean, default: false },

    // NEW FIELDS
    educationQualification: { type: String, default: "" },
    employmentStatus: { type: String, default: "" },
    duration: { type: Number, default: null }, // in days, optional

    image: { type: String },
    documents: [{ type: String }],

    owner: { type: String, required: true },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Campaign", campaignSchema);
