// utils/fast2smsSender.js
// Fast2SMS Free SMS Service (10 SMS/day free, ongoing)
// Sign up: https://www.fast2sms.com/
// Get API key from: Dashboard → API Keys

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// ============================================
// CONFIGURATION - FAST2SMS CREDENTIALS
// ============================================
// Get API key from: https://www.fast2sms.com/dashboard/dev-api
// FREE TIER: 10 SMS per day (300/month) - Ongoing, no expiry!
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;
const FAST2SMS_SENDER_ID = process.env.FAST2SMS_SENDER_ID || "SEUMP"; // Your sender name (max 6 chars)

// Fast2SMS API endpoint
const FAST2SMS_API_URL = "https://www.fast2sms.com/dev/bulkV2";

// Check if SMS is enabled
const isSMSEnabled = FAST2SMS_API_KEY && FAST2SMS_API_KEY.length > 0;

if (!isSMSEnabled) {
  console.warn("⚠️ Fast2SMS API key not configured. SMS notifications are disabled.");
  console.warn("   Sign up at: https://www.fast2sms.com/");
  console.warn("   Get API key from: Dashboard → API Keys");
  console.warn("   Add to .env: FAST2SMS_API_KEY=your_api_key_here");
} else {
  console.log("✅ Fast2SMS SMS service initialized");
  console.log(`   Sender ID: ${FAST2SMS_SENDER_ID}`);
  console.log(`   Free tier: 10 SMS/day (300/month) - Ongoing!`);
}

/**
 * Send SMS via Fast2SMS (FREE: 10 SMS/day)
 * @param {string} recipientNumber - Phone number in format: 917058733358 (without +, with country code)
 * @param {string} messageText - Message to send (max 160 chars for single SMS)
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const sendFast2SMS = async (recipientNumber, messageText) => {
  try {
    // Validate inputs
    if (!recipientNumber || !messageText) {
      return {
        success: false,
        error: "Recipient number and message text are required"
      };
    }

    // Check if SMS is enabled
    if (!isSMSEnabled) {
      return {
        success: false,
        error: "Fast2SMS API key not configured. Please add FAST2SMS_API_KEY to .env file"
      };
    }

    // Format phone number (remove + if present, ensure it's 10-12 digits)
    let phone = recipientNumber.replace(/[+\s-]/g, '');
    
    // Validate Indian phone number (should be 10 digits + 91 country code = 12 digits)
    if (phone.length < 10 || phone.length > 12) {
      return {
        success: false,
        error: `Invalid phone number format. Expected 10-12 digits, got: ${phone.length}`
      };
    }

    // If 10 digits, assume India and add country code
    if (phone.length === 10) {
      phone = `91${phone}`;
    }

    // Truncate message if too long (Fast2SMS supports up to 160 chars per SMS)
    const maxLength = 160;
    const truncatedMessage = messageText.length > maxLength 
      ? messageText.substring(0, maxLength - 3) + '...'
      : messageText;

    // Prepare API request
    const requestBody = {
      route: "q", // Quick route (fastest delivery)
      message: truncatedMessage,
      language: "english",
      numbers: phone
    };

    console.log(`📱 Fast2SMS API Request:`);
    console.log(`   URL: ${FAST2SMS_API_URL}`);
    console.log(`   Phone: ${phone} (original: ${recipientNumber})`);
    console.log(`   Message length: ${truncatedMessage.length} chars`);
    console.log(`   API Key present: ${FAST2SMS_API_KEY ? 'Yes' : 'No'}`);

    // Make API call
    const response = await fetch(FAST2SMS_API_URL, {
      method: 'POST',
      headers: {
        'authorization': FAST2SMS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`📱 Fast2SMS API Response Status: ${response.status} ${response.statusText}`);
    
    const result = await response.json();
    console.log(`📱 Fast2SMS API Response:`, JSON.stringify(result, null, 2));

    // Check response
    if (result.return === true && result.request_id) {
      console.log(`✅ Fast2SMS sent successfully to ${phone}`);
      console.log(`   Request ID: ${result.request_id}`);
      return {
        success: true,
        data: {
          requestId: result.request_id,
          message: "SMS sent successfully",
          phone: phone
        }
      };
    } else {
      const errorMsg = result.message || "Unknown error from Fast2SMS";
      
      // Check if it's a daily limit error
      if (errorMsg.toLowerCase().includes('limit') || errorMsg.toLowerCase().includes('quota') || errorMsg.toLowerCase().includes('daily')) {
        console.warn(`⚠️ Fast2SMS daily limit reached (10 SMS/day). SMS not sent to ${phone}`);
        console.warn(`   Note: Free tier allows 10 SMS/day. Limit resets at midnight IST.`);
        return {
          success: false,
          error: "Daily SMS limit reached (10 SMS/day). Limit resets at midnight IST.",
          isLimitReached: true
        };
      }
      
      console.error(`❌ Fast2SMS error: ${errorMsg}`);
      return {
        success: false,
        error: errorMsg
      };
    }

  } catch (error) {
    console.error("Error sending Fast2SMS:", error);
    return {
      success: false,
      error: error.message || "Failed to send SMS"
    };
  }
};

/**
 * Send donation thank you SMS
 * @param {string} recipientNumber - Phone number
 * @param {string} donorName - Donor's name
 * @param {number} amount - Donation amount
 * @param {string} campaignTitle - Campaign title
 */
export const sendDonationThankYouSMS = async (recipientNumber, donorName, amount, campaignTitle) => {
  // Truncate campaign title if too long (to fit in 160 char SMS)
  const shortTitle = campaignTitle.length > 30 
    ? campaignTitle.substring(0, 27) + '...' 
    : campaignTitle;
  
  // Format: "Thank You Test user your donation of rs 100 "Test Campaign" is greatly appreciated - SEUMP"
  const message = `Thank You ${donorName} your donation of rs ${amount.toLocaleString('en-IN')} "${shortTitle}" is greatly appreciated - SEUMP`;
  
  console.log(`📱 Preparing SMS: To=${recipientNumber}, Message length=${message.length}`);
  console.log(`📱 SMS Message: ${message}`);
  
  return await sendFast2SMS(recipientNumber, message);
};

/**
 * Send campaign created confirmation SMS
 * @param {string} recipientNumber - Phone number
 * @param {string} campaignTitle - Campaign title
 */
export const sendCampaignCreatedSMS = async (recipientNumber, campaignTitle) => {
  const message = `Your campaign "${campaignTitle}" has been created successfully! We'll notify you once it's approved. - SEUMP`;
  return await sendFast2SMS(recipientNumber, message);
};

/**
 * Send campaign approved notification SMS
 * @param {string} recipientNumber - Phone number
 * @param {string} campaignTitle - Campaign title
 */
export const sendCampaignApprovedSMS = async (recipientNumber, campaignTitle) => {
  const message = `Great news! Your campaign "${campaignTitle}" has been approved and is now live! Share it to reach your goal. - SEUMP`;
  return await sendFast2SMS(recipientNumber, message);
};

