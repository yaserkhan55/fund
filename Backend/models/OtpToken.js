import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otpHash: { type: String, required: true },
  expireAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 }
});

// ❌ NO TTL INDEX HERE
// We will check expiry manually.

export default mongoose.model("OtpToken", otpSchema);
