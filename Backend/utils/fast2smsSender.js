import axios from "axios";

export async function sendFast2SMS(recipientNumber, message) {
  try {
    const API_KEY = process.env.FAST2SMS_API_KEY;

    const params = {
      authorization: API_KEY,
      route: "q",
      message: message,
      numbers: recipientNumber.toString(),
      flash: "0"
    };

    const response = await axios.get(
      "https://www.fast2sms.com/dev/bulkV2",
      { params }
    );

    return { success: true, data: response.data };

  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
}

// Template SMS
export async function sendDonationThankYouSMS(number, donorName, amount, title) {
  return sendFast2SMS(number, `Thanks ${donorName || ""} for donating ₹${amount} to "${title}".`);
}

export async function sendCampaignCreatedSMS(number, title) {
  return sendFast2SMS(number, `Your campaign "${title}" is created and awaiting approval.`);
}

export async function sendCampaignApprovedSMS(number, title) {
  return sendFast2SMS(number, `Your campaign "${title}" is approved and now live.`);
}
