import mongoose from "mongoose";

const clerkProfileSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      default: "",
      lowercase: true,
    },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    username: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    phoneNumbers: [{ type: String }],
    primaryEmailId: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "deleted"],
      default: "active",
    },
    lastSyncedAt: { type: Date, default: Date.now },
    raw: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("ClerkProfile", clerkProfileSchema);

