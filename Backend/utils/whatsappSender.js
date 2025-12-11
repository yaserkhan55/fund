import dotenv from "dotenv";
dotenv.config();

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_API_URL = `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`;

// ========================================================
// Main WhatsApp Message Sender (Text or Template)
// ========================================================
export const sendWhatsAppMessage = async (recipientNumber, messageText) => {
  try {
    if (!ACCESS_TOKEN) {
      return { success: false, error: "WhatsApp Access Token missing in .env" };
    }
    if (!PHONE_NUMBER_ID) {
      return { success: false, error: "Phone Number ID missing in .env" };
    }

    if (!recipientNumber || !messageText) {
      return { success: false, error: "Recipient number and message are required" };
    }

    // Free-form text allowed ONLY after Meta approval
    const messagePayload = {
      messaging_product: "whatsapp",
      to: recipientNumber,
      type: "text",
      text: { body: messageText }
    };

    const response = await fetch(WHATSAPP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`
      },
      body: JSON.stringify(messagePayload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("WhatsApp Error:", data);
      return {
        success: false,
        error: data.error?.message || "Failed to send WhatsApp message",
        details: data
      };
    }

    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ========================================================
// Predefined Notifications
// ========================================================
export const sendDonationThankYou = async (recipient, donorName, amount, campaign) => {
  const msg = `🙏 Thank you ${donorName || "dear supporter"}!
Your donation of ₹${amount.toLocaleString("en-IN")} to "${campaign}" has been received.
Your support means a lot! 💙
- SEUMP Team`;

  return await sendWhatsAppMessage(recipient, msg);
};

export const sendCampaignCreatedNotification = async (recipient, campaign) => {
  const msg = `🎉 Campaign Created!
Your campaign "${campaign}" is under review.
We'll update you within 24–48 hours.
- SEUMP Team`;

  return await sendWhatsAppMessage(recipient, msg);
};

export const sendCampaignApprovedNotification = async (recipient, campaign) => {
  const msg = `✅ Good News!
Your campaign "${campaign}" is now LIVE!
Start sharing to reach your goal 🚀
- SEUMP Team`;

  return await sendWhatsAppMessage(recipient, msg);
};
