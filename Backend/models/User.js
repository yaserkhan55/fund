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
      required: [true, "Password is required"],
      minlength: 6,
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
      enum: ["local", "google"],
      default: "local",
    },
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
