import axios from "axios";

const API_KEY = process.env.FAST2SMS_API_KEY;

const FAST2SMS_URL = "https://www.fast2sms.com/dev/bulkV2";

export async function sendFast2SMS(recipientNumber, message) {
  try {
    const payload = {
      route: "v3",
      sender_id: "TXTIND",
      message: message,
      language: "english",
      flash: 0,
      numbers: recipientNumber.toString(),
    };

    const headers = {
      authorization: API_KEY,
      "Content-Type": "application/json",
    };

    const response = await axios.post(FAST2SMS_URL, payload, { headers });

    return { success: true, data: response.data };
  } catch (error) {
    console.error("Fast2SMS Error:", error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

// ---------- TEMPLATE SMS ----------

// Donation Thank You SMS
export async function sendDonationThankYouSMS(recipientNumber, donorName, amount, campaignTitle) {
  const message = `Thank you ${donorName || ""} for donating ₹${amount} to "${campaignTitle}". We appreciate your support!`;
  return sendFast2SMS(recipientNumber, message);
}

// Campaign Created SMS
export async function sendCampaignCreatedSMS(recipientNumber, campaignTitle) {
  const message = `Your campaign "${campaignTitle}" has been created successfully. Awaiting admin approval.`;
  return sendFast2SMS(recipientNumber, message);
}

// Campaign Approved SMS
export async function sendCampaignApprovedSMS(recipientNumber, campaignTitle) {
  const message = `Good news! Your campaign "${campaignTitle}" has been approved and is now live.`;
  return sendFast2SMS(recipientNumber, message);
}
