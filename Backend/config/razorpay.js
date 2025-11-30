// config/razorpay.js
import crypto from "crypto";

// Lazy load Razorpay to handle missing package gracefully
let Razorpay = null;
let razorpayAvailable = false;

// Function to load Razorpay
async function loadRazorpay() {
  if (razorpayAvailable) return Razorpay;
  
  try {
    const razorpayModule = await import("razorpay");
    Razorpay = razorpayModule.default || razorpayModule;
    razorpayAvailable = true;
    return Razorpay;
  } catch (error) {
    console.error("❌ Razorpay package not installed.");
    console.error("Please run: npm install razorpay");
    razorpayAvailable = false;
    return null;
  }
}

// Initialize Razorpay instance
let razorpayInstance = null;

// Initialize function
export async function initializeRazorpay() {
  if (razorpayInstance) return razorpayInstance;
  
  const RazorpayClass = await loadRazorpay();
  
  if (!RazorpayClass) {
    console.log("⚠️ Razorpay package not installed. Payment gateway will not work.");
    return null;
  }
  
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.log("⚠️ Razorpay credentials not found. Payment gateway will not work.");
    return null;
  }
  
  try {
    razorpayInstance = new RazorpayClass({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log("✅ Razorpay initialized successfully");
    return razorpayInstance;
  } catch (error) {
    console.error("❌ Failed to initialize Razorpay:", error.message);
    return null;
  }
}

// Verify payment signature
export const verifyPaymentSignature = (orderId, paymentId, signature) => {
  if (!process.env.RAZORPAY_KEY_SECRET) {
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
    await initializeRazorpay();
  }
  
  if (!razorpayInstance) {
    throw new Error("Razorpay not configured. Please install razorpay package and set credentials.");
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
    await initializeRazorpay();
  }
  
  if (!razorpayInstance) {
    throw new Error("Razorpay not configured. Please install razorpay package and set credentials.");
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
    await initializeRazorpay();
  }
  
  if (!razorpayInstance) {
    throw new Error("Razorpay not configured. Please install razorpay package and set credentials.");
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

// Initialize on module load (non-blocking)
initializeRazorpay().catch(err => {
  console.error("Failed to initialize Razorpay:", err.message);
});

export default razorpayInstance;
