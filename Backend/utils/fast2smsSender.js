// utils/fast2smsSender.js
// Fast2SMS Free Route (NO DLT REQUIRED)

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

// Load .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

// API Key
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || "";
const FAST2SMS_API_URL = "https://www.fast2sms.com/dev/bulkV2";

const isSMSEnabled = FAST2SMS_API_KEY.length > 0;

if (!isSMSEnabled) {
  console.warn("⚠ Fast2SMS API key missing. SMS disabled.");
} else {
  console.log("✅ Fast2SMS initialized (Free Route - No DLT required)");
}

/* =======================================================
   1. CORE SIMPLE SMS SENDER
======================================================= */
export const sendFast2SMS = async (recipientNumber, messageText) => {
  try {
    if (!isSMSEnabled) {
      return { success: false, error: "Fast2SMS API key not configured" };
    }

    if (!recipientNumber || !messageText) {
      return { success: false, error: "Phone and message required" };
    }

    // Clean phone number
    let phone = recipientNumber.replace(/[+\s-]/g, "");
    if (phone.length === 10) phone = "91" + phone;

    // Simple text only - remove special characters
    messageText = messageText.replace(/["'₹%&*<>]/g, "");

    const body = {
      route: "q",
      message: messageText,
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
    console.log("📩 Fast2SMS Response:", result);

    if (result.return === true) {
      return { success: true, data: result };
    }

    return { success: false, error: result.message || "SMS failed" };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/* =======================================================
   2. DONATION THANK YOU SMS (Simple)
======================================================= */
export const sendDonationThankYouSMS = async (
  recipientNumber,
  donorName,
  amount
) => {
  const name = donorName || "Donor";

  const message = `Thank you ${name} for your donation of Rs ${amount}. Your support is appreciated.`;

  return await sendFast2SMS(recipientNumber, message);
};

/* =======================================================
   3. CAMPAIGN CREATED SMS
======================================================= */
export const sendCampaignCreatedSMS = async (recipientNumber, campaignTitle) => {
  const title = campaignTitle || "your campaign";

  const message = `Your campaign ${title} has been created successfully.`;

  return await sendFast2SMS(recipientNumber, message);
};

/* =======================================================
   4. CAMPAIGN APPROVED SMS
======================================================= */
export const sendCampaignApprovedSMS = async (
  recipientNumber,
  campaignTitle
) => {
  const title = campaignTitle || "your campaign";

  const message = `Your campaign ${title} is approved and now live.`;

  return await sendFast2SMS(recipientNumber, message);
};

/* =======================================================
   EXPORT ALL (PREVENT FUTURE ERRORS)
======================================================= */
export default {
  sendFast2SMS,
  sendDonationThankYouSMS,
  sendCampaignCreatedSMS,
  sendCampaignApprovedSMS
};
