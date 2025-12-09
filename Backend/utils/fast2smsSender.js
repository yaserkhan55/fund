import axios from "axios";

export async function sendFast2SMS(recipientNumber, message) {
  try {
    const apiKey = process.env.FAST2SMS_API_KEY;

    const payload = {
      route: "v3",
      sender_id: "TXTIND",
      message: message,
      language: "english",
      numbers: recipientNumber.toString()
    };

    const response = await axios.post(
      "https://www.fast2sms.com/dev/wrapper/sendSMS",
      payload,
      {
        headers: {
          "authorization": apiKey,
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        }
      }
    );

    return { success: true, data: response.data };

  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
}

// =========================
// TEMPLATE SMS FUNCTIONS
// =========================

// Thank You SMS
export async function sendDonationThankYouSMS(recipientNumber, donorName, amount, campaignTitle) {
  const msg = `Thank you ${donorName || ""} for donating ₹${amount} to "${campaignTitle}". We appreciate your support!`;
  return sendFast2SMS(recipientNumber, msg);
}

// Campaign Created
export async function sendCampaignCreatedSMS(recipientNumber, campaignTitle) {
  const msg = `Your campaign "${campaignTitle}" has been created successfully. Awaiting admin approval.`;
  return sendFast2SMS(recipientNumber, msg);
}

// Campaign Approved
export async function sendCampaignApprovedSMS(recipientNumber, campaignTitle) {
  const msg = `Good news! Your campaign "${campaignTitle}" has been approved and is now live.`;
  return sendFast2SMS(recipientNumber, msg);
}
