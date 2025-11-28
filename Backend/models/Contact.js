import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      default: "",
    },
    query: {
      type: String,
      required: [true, "Query is required"],
    },
    status: {
      type: String,
      enum: ["pending", "resolved", "archived"],
      default: "pending",
    },
    adminResponse: {
      type: String,
      default: "",
    },
    respondedAt: {
      type: Date,
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Contact", contactSchema);

