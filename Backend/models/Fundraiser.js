import mongoose from "mongoose";

const fundraiserSchema = new mongoose.Schema({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Step 1: who for
  beneficiaryType: { type: String, enum: ["self","someone","organization"], default: "self" },

  // Step 2: category
  category: { type: String, default: "" },

  // Step 3: beneficiary / patient details
  beneficiary: {
    name: String,
    age: Number,
    gender: String,
    relation: String,
    condition: String,
    hospital: String,
    city: String,
  },

  // Step 4: campaign details
  title: String,
  story: String,
  goalAmount: { type: Number, default: 0 },
  coverImage: String,      // path to uploads
  gallery: [String],       // paths
  videoUrl: String,

  // Step 5: bank / payout info
  payout: {
    accountHolder: String,
    accountNumber: String,
    ifsc: String,
    bankName: String,
    panNumber: String,
    upiId: String,
    panFile: String,
    cancelledCheque: String,
  },

  // Admin & publish info
  status: { type: String, enum: ["draft","pending","published","rejected"], default: "draft" },
  publishedAt: Date,

  // metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

fundraiserSchema.pre("save", function(next){
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Fundraiser", fundraiserSchema);
