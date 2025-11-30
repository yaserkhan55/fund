// config/razorpay.js
import Razorpay from "razorpay";
import crypto from "crypto";

// Initialize Razorpay
let razorpayInstance = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log("✅ Razorpay initialized successfully");
} else {
  console.log("⚠️ Razorpay credentials not found. Payment gateway will not work.");
}

// Verify payment signature
export const verifyPaymentSignature = (orderId, paymentId, signature) => {
  if (!razorpayInstance) {
    throw new Error("Razorpay not configured");
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  const text = `${orderId}|${paymentId}`;
  const generatedSignature = crypto
    .createHmac("sha256", secret)
    .update(text)
    .digest("hex");

  return generatedSignature === signature;
};

// Create order
export const createOrder = async (amount, currency = "INR", receipt = null) => {
  if (!razorpayInstance) {
    throw new Error("Razorpay not configured");
  }

  const options = {
    amount: amount * 100, // Convert to paise
    currency,
    receipt: receipt || `receipt_${Date.now()}`,
    payment_capture: 1, // Auto capture
  };

  try {
    const order = await razorpayInstance.orders.create(options);
    return order;
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    throw error;
  }
};

// Get payment details
export const getPaymentDetails = async (paymentId) => {
  if (!razorpayInstance) {
    throw new Error("Razorpay not configured");
  }

  try {
    const payment = await razorpayInstance.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error("Razorpay fetch payment error:", error);
    throw error;
  }
};

// Refund payment
export const refundPayment = async (paymentId, amount = null) => {
  if (!razorpayInstance) {
    throw new Error("Razorpay not configured");
  }

  try {
    const refundOptions = {
      payment_id: paymentId,
    };

    if (amount) {
      refundOptions.amount = amount * 100; // Convert to paise
    }

    const refund = await razorpayInstance.payments.refund(paymentId, refundOptions);
    return refund;
  } catch (error) {
    console.error("Razorpay refund error:", error);
    throw error;
  }
};

export default razorpayInstance;

