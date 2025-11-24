import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    // Basic Fields
    title: { type: String, required: true },
    shortDescription: String,
    fullStory: String,
    goalAmount: Number,
    category: String,
    beneficiaryName: String,
    city: String,
    relation: String,
    educationQualification: { type: String },
employmentStatus: { type: String },
duration: { type: Number }, // duration in days or weeks (your choice)


    // Uploads
    image: String,
    documents: [String],

    zakatEligible: { type: Boolean, default: false },

    // ✔ IMPORTANT — Clerk user ID (string, not ObjectId)
    owner: { type: String, required: true }, // Clerk user id

    // ✔ NEW STATUS (replaces "isApproved")
    // pending → admin approves → approved
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // donations
    raisedAmount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* --------------------------------------------------------------
   VIRTUALS
-------------------------------------------------------------- */

campaignSchema.virtual("imageUrl").get(function () {
  if (!this.image) return null;

  // Normalize to https
  return this.image.replace(/^http:\/\//, "https://");
});

campaignSchema.virtual("documentUrls").get(function () {
  if (!Array.isArray(this.documents)) return [];
  return this.documents.map((d) => d.replace(/^http:\/\//, "https://"));
});

export default mongoose.model("Campaign", campaignSchema);
