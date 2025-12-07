// utils/whatsappSender.js
// WhatsApp Notification Service using WhatsApp Cloud API

// Configuration - Update these values
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || "EAAZCfaEVVn7EBQNvysKPpeOzABxsnSMrdclqf9yy9LcA9nMBNcotAuEUZA5N1SErua0HycMHrjqSlle9Xk8Tr8v7LGdPzZC3a8ZCaK1IWKGZCAaWHHnA7oUHyQwGMKFsZCJo3kGlu7fZBsIZCmZC46y9g4dZCcdlPoK2raFiQPoZCQdGc6ujppWx6YatWr62QPhiyISzWvrgBkDXdnjnGU6Of12cwZAll2O1HOGEkVVaTZCtLes8XePCw0gkR9MZBJz25X5rnGJtSbpSI44ml3F8GtSCbtHM5F";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "926454387213927";
const WHATSAPP_API_URL = `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`;

/**
 * Send WhatsApp text message
 * @param {string} recipientNumber - Phone number in format: 917058733358 (with country code, no +)
 * @param {string} messageText - Message to send
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const sendWhatsAppMessage = async (recipientNumber, messageText) => {
  try {
    // Validate inputs
    if (!recipientNumber || !messageText) {
      return {
        success: false,
        error: "Recipient number and message text are required"
      };
    }

    // Validate access token
    if (!ACCESS_TOKEN || ACCESS_TOKEN === "PASTE_MY_TOKEN_HERE") {
      console.warn("⚠️ WhatsApp Access Token not configured");
      return {
        success: false,
        error: "WhatsApp Access Token not configured"
      };
    }

    // Prepare the message payload
    const messagePayload = {
      messaging_product: "whatsapp",
      to: recipientNumber,
      type: "text",
      text: {
        body: messageText
      }
    };

    // Send request to WhatsApp Cloud API
    const response = await fetch(WHATSAPP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ACCESS_TOKEN}`
      },
      body: JSON.stringify(messagePayload)
    });

    const responseData = await response.json();

    // Check if the request was successful
    if (!response.ok) {
      console.error("WhatsApp API Error:", responseData);
      return {
        success: false,
        error: responseData.error?.message || "Failed to send WhatsApp message",
        details: responseData.error || responseData
      };
    }

    // Success
    console.log("✅ WhatsApp message sent successfully to", recipientNumber);
    return {
      success: true,
      data: responseData
    };

  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred"
    };
  }
};

/**
 * Send donation thank you message
 * @param {string} recipientNumber - Donor's phone number
 * @param {string} donorName - Donor's name
 * @param {number} amount - Donation amount
 * @param {string} campaignTitle - Campaign title
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const sendDonationThankYou = async (recipientNumber, donorName, amount, campaignTitle) => {
  const message = `🙏 Thank you ${donorName || "dear supporter"}!

Your generous donation of ₹${amount.toLocaleString('en-IN')} to "${campaignTitle}" has been received.

Your contribution makes a real difference! 💙

- SEUMP Team`;
  
  return await sendWhatsAppMessage(recipientNumber, message);
};

/**
 * Send campaign creation confirmation
 * @param {string} recipientNumber - Campaign creator's phone number
 * @param {string} campaignTitle - Campaign title
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const sendCampaignCreatedNotification = async (recipientNumber, campaignTitle) => {
  const message = `🎉 Campaign Created Successfully!

Your campaign "${campaignTitle}" has been submitted for review.

Our team will review it within 24-48 hours. You'll be notified once it's approved.

Thank you for using SEUMP! 💙

- SEUMP Team`;
  
  return await sendWhatsAppMessage(recipientNumber, message);
};

/**
 * Send campaign approval notification
 * @param {string} recipientNumber - Campaign creator's phone number
 * @param {string} campaignTitle - Campaign title
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const sendCampaignApprovedNotification = async (recipientNumber, campaignTitle) => {
  const message = `✅ Great News!

Your campaign "${campaignTitle}" has been approved and is now live!

Start sharing your campaign to reach your fundraising goal. 🚀

- SEUMP Team`;
  
  return await sendWhatsAppMessage(recipientNumber, message);
};

