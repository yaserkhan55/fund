import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: function() {
        // Password not required for Clerk/Google users
        return this.provider === "local";
      },
      validate: {
        validator: function(v) {
          // If provider is local, password must be at least 6 chars
          if (this.provider === "local") {
            return !v || v.length >= 6;
          }
          return true; // No validation for non-local providers
        },
        message: "Password must be at least 6 characters"
      }
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // ============================
    // ✅ GOOGLE LOGIN FIELDS (ADDED)
    // ============================
    googleId: {
      type: String,
      default: null,
    },

    picture: {
      type: String,
      default: "",
    },

    provider: {
      type: String,
      enum: ["local", "google", "clerk"],
      default: "local",
    },

    // ============================
    // ✅ CLERK LOGIN FIELDS (ADDED)
    // ============================
    clerkId: {
      type: String,
      default: null,
      sparse: true, // Allows multiple nulls
    },
    // ============================
    // ============================

    // ============================
    // ✅ OTP LOGIN FIELDS (EXISTING)
    // ============================
    phone: {
      type: String,
      default: "",
    },

    otp: {
      type: String,
      default: null,
    },

    otpExpires: {
      type: Date,
      default: null,
    },
    // ============================

    // PROFILE FIELDS
    occupation: { type: String, default: "" },
    education: { type: String, default: "" },
    address: { type: String, default: "" },
    dob: { type: String, default: "" },
    gender: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
