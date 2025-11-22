// models/Campaign.js
import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    shortDescription: String,
    fullStory: String,
    goalAmount: Number,
    category: String,
    beneficiaryName: String,
    city: String,
    relation: String,

    image: String,            // cloudinary URL
    documents: [String],      // cloudinary URLs array

    zakatEligible: { type: Boolean, default: false },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isApproved: { type: Boolean, default: false },

    raisedAmount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// SINGLE correct virtual
campaignSchema.virtual("imageUrl").get(function () {
  if (!this.image) return null;

  // full URL → normalize
  if (this.image.startsWith("http://") || this.image.startsWith("https://")) {
    return this.image.replace(/^http:\/\//, "https://");
  }

  // fallback
  return this.image;
});

// documents
campaignSchema.virtual("documentUrls").get(function () {
  if (!Array.isArray(this.documents)) return [];

  return this.documents.map((d) =>
    d?.replace(/^http:\/\//, "https://")
  );
});

export default mongoose.model("Campaign", campaignSchema);
