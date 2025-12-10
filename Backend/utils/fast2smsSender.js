import axios from "axios";

export async function sendFast2SMS(recipientNumber, message) {
  try {
    const API_KEY = process.env.FAST2SMS_API_KEY;

    const payload = {
      route: "v3",
      sender_id: "TXTIND",
      message: message,
      language: "english",
      numbers: recipientNumber.toString(),
    };

    const response = await axios.post(
      "https://www.fast2sms.com/dev/wrapper/sendSMS",
      payload,
      {
        headers: {
          authorization: API_KEY,
          "Content-Type": "application/json"
        }
      }
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
  return sendFast2SMS(
    number,
    `Thanks ${donorName || ""} for donating ₹${amount} to "${title}".`
  );
}

export async function sendCampaignCreatedSMS(number, title) {
  return sendFast2SMS(
    number,
    `Your campaign "${title}" is created and awaiting approval.`
  );
}

export async function sendCampaignApprovedSMS(number, title) {
  return sendFast2SMS(
    number,
    `Your campaign "${title}" is approved and now live.`
  );
}
