// controllers/smsController.js
// Separate SMS Controller (No changes to donationController.js needed)

import { sendDonationThankYouSMS } from "../utils/fast2smsSender.js";
import Donation from "../models/Donation.js";

/**
 * MANUAL / INDEPENDENT SMS SENDER
 * This allows sending Thank You SMS without touching donationController.js
 * Can be triggered by route: POST /sms/send-donation
 */
export const sendDonationSMS = async (req, res) => {
  try {
    const { donationId } = req.body;

    if (!donationId) {
      return res.status(400).json({
        success: false,
        message: "donationId is required"
      });
    }

    // Fetch donation info
    const donation = await Donation.findById(donationId);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found"
      });
    }

    // Extract fields
    const donorName = donation.name;
    const phone = donation.phone;
    const amount = donation.amount;

    // SEND SMS (non-DLT safe)
    await sendDonationThankYouSMS(phone, donorName, amount);

    return res.status(200).json({
      success: true,
      message: "SMS sent successfully",
      donationId: donationId
    });

  } catch (error) {
    console.error("SMS Send error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send SMS",
      error: error.message
    });
  }
};


/**
 * DIRECT SEND WITHOUT donationId
 * You can use it for testing or external SMS sending
 * Example body:
 * { "phone": "9170xxxxx", "name": "John", "amount": 100 }
 */
export const sendDirectDonationSMS = async (req, res) => {
  try {
    const { phone, name, amount } = req.body;

    if (!phone || !name || !amount) {
      return res.status(400).json({
        success: false,
        message: "phone, name, and amount are required"
      });
    }

    await sendDonationThankYouSMS(phone, name, amount);

    return res.status(200).json({
      success: true,
      message: "Direct SMS sent successfully"
    });

  } catch (error) {
    console.error("Direct SMS error:", error);
    return res.status(500).json({
      success: false,
      message: "SMS sending failed",
      error: error.message
    });
  }
};
