// utils/twilioWhatsAppSender.js
// Twilio WhatsApp Notification Service

import twilio from 'twilio';

// ============================================
// CONFIGURATION - TWILIO CREDENTIALS
// ============================================
// Get these from: https://console.twilio.com/
// Account → API Keys & Tokens
const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "YOUR_ACCOUNT_SID_HERE";
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "YOUR_AUTH_TOKEN_HERE";
const WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886"; // Twilio sandbox number (replace with your number)

// Initialize Twilio client
const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

/**
 * Send WhatsApp message via Twilio
 * @param {string} recipientNumber - Phone number in format: +917058733358 (with + and country code)
 * @param {string} messageText - Message to send
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const sendTwilioWhatsApp = async (recipientNumber, messageText) => {
  try {
    // Validate inputs
    if (!recipientNumber || !messageText) {
      return {
        success: false,
        error: "Recipient number and message text are required"
      };
    }

    // Validate credentials
    if (!ACCOUNT_SID || ACCOUNT_SID === "YOUR_ACCOUNT_SID_HERE" || 
        !AUTH_TOKEN || AUTH_TOKEN === "YOUR_AUTH_TOKEN_HERE") {
      console.warn("⚠️ Twilio credentials not configured");
      return {
        success: false,
        error: "Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables."
      };
    }

    // Format recipient number (ensure it starts with whatsapp:)
    const formattedTo = recipientNumber.startsWith('whatsapp:') 
      ? recipientNumber 
      : `whatsapp:${recipientNumber.startsWith('+') ? recipientNumber : '+' + recipientNumber}`;

    // Send WhatsApp message via Twilio
    const message = await client.messages.create({
      from: WHATSAPP_FROM,
      to: formattedTo,
      body: messageText
    });

    // Success
    console.log("✅ Twilio WhatsApp message sent successfully:", message.sid);
    return {
      success: true,
      data: {
        messageSid: message.sid,
        status: message.status,
        to: message.to,
        from: message.from
      }
    };

  } catch (error) {
    console.error("Error sending Twilio WhatsApp message:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
      details: error
    };
  }
};

/**
 * Send donation thank you message via Twilio
 * @param {string} recipientNumber - Donor's phone number
 * @param {string} donorName - Donor's name
 * @param {number} amount - Donation amount
 * @param {string} campaignTitle - Campaign title
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const sendTwilioDonationThankYou = async (recipientNumber, donorName, amount, campaignTitle) => {
  const message = `🙏 Thank you ${donorName || "dear supporter"}!

Your generous donation of ₹${amount.toLocaleString('en-IN')} to "${campaignTitle}" has been received.

Your contribution makes a real difference! 💙

- SEUMP Team`;
  
  return await sendTwilioWhatsApp(recipientNumber, message);
};

/**
 * Send campaign creation confirmation via Twilio
 * @param {string} recipientNumber - Campaign creator's phone number
 * @param {string} campaignTitle - Campaign title
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const sendTwilioCampaignCreated = async (recipientNumber, campaignTitle) => {
  const message = `🎉 Campaign Created Successfully!

Your campaign "${campaignTitle}" has been submitted for review.

Our team will review it within 24-48 hours. You'll be notified once it's approved.

Thank you for using SEUMP! 💙

- SEUMP Team`;
  
  return await sendTwilioWhatsApp(recipientNumber, message);
};

/**
 * Send campaign approval notification via Twilio
 * @param {string} recipientNumber - Campaign creator's phone number
 * @param {string} campaignTitle - Campaign title
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const sendTwilioCampaignApproved = async (recipientNumber, campaignTitle) => {
  const message = `✅ Great News!

Your campaign "${campaignTitle}" has been approved and is now live!

Start sharing your campaign to reach your fundraising goal. 🚀

- SEUMP Team`;
  
  return await sendTwilioWhatsApp(recipientNumber, message);
};

