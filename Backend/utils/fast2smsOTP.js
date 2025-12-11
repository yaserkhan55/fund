// utils/fast2smsOTP.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

// Load .env variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

// Fast2SMS API Key
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || "";
const FAST2SMS_API_URL = "https://www.fast2sms.com/dev/bulkV2";

// Basic check
if (!FAST2SMS_API_KEY) {
  console.warn("⚠ Fast2SMS API key missing.");
}

/**
 * Send SIMPLE SMS without DLT (OTP Route)
 */
export const sendSimpleSMS = async (recipientNumber) => {
  try {
    if (!FAST2SMS_API_KEY) {
      return { success: false, error: "API key not configured" };
    }

    let phone = recipientNumber.replace(/[+\s-]/g, "");
    if (phone.length === 10) phone = "91" + phone;

    const message = "Thank you for your support.";

    const body = {
      route: "v", // OTP/Service Implicit Route (DLT FREE)
      message: message,
      language: "english",
      numbers: phone
    };

    const response = await fetch(FAST2SMS_API_URL, {
      method: "POST",
      headers: {
        authorization: FAST2SMS_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    console.log("📩 Fast2SMS:", result);

    if (result.return === true) {
      return { success: true, data: result };
    }

    return { success: false, error: result.message || "Failed" };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export default { sendSimpleSMS };
