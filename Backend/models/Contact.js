import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    clerkId: {
      type: String,
      default: null,
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
    // Enhanced: Conversation thread
    conversation: [
      {
        sender: {
          type: String,
          enum: ["user", "admin"],
          required: true,
        },
        message: {
          type: String,
          required: true,
        },
        attachments: [{ type: String }],
        createdAt: {
          type: Date,
          default: Date.now,
        },
        sentBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    tags: [{ type: String }],
    notificationSent: {
      type: Boolean,
      default: false,
    },
    lastNotificationAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Contact", contactSchema);

