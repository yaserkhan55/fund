// routes/smsRoutes.js
import express from "express";
import { 
  sendFast2SMS, 
  sendDonationThankYouSMS, 
  sendCampaignCreatedSMS, 
  sendCampaignApprovedSMS 
} from "../utils/fast2smsSender.js";

const router = express.Router();

// Test endpoint - Send a test SMS
router.post("/test", async (req, res) => {
  try {
    const { recipientNumber, message } = req.body;
    
    const recipient = recipientNumber || "917058733358"; // Default recipient (without +)
    const messageText = message || "Hello! Your SMS notification from SEUMP is working 🚀";
    
    const result = await sendFast2SMS(recipient, messageText);
    
    if (result.success) {
      return res.json({
        success: true,
        message: "SMS sent successfully",
        data: result.data
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error("SMS test error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message
    });
  }
});

// Send donation thank you SMS
router.post("/donation-thank-you", async (req, res) => {
  try {
    const { recipientNumber, donorName, amount, campaignTitle } = req.body;
    
    if (!recipientNumber || !amount || !campaignTitle) {
      return res.status(400).json({
        success: false,
        error: "recipientNumber, amount, and campaignTitle are required"
      });
    }
    
    const result = await sendDonationThankYouSMS(recipientNumber, donorName, amount, campaignTitle);
    
    if (result.success) {
      return res.json({
        success: true,
        message: "Donation thank you SMS sent successfully",
        data: result.data
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error("Donation thank you SMS error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message
    });
  }
});

// Send campaign created confirmation SMS
router.post("/campaign-created", async (req, res) => {
  try {
    const { recipientNumber, campaignTitle } = req.body;
    
    if (!recipientNumber || !campaignTitle) {
      return res.status(400).json({
        success: false,
        error: "recipientNumber and campaignTitle are required"
      });
    }
    
    const result = await sendCampaignCreatedSMS(recipientNumber, campaignTitle);
    
    if (result.success) {
      return res.json({
        success: true,
        message: "Campaign created SMS sent successfully",
        data: result.data
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error("Campaign created SMS error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message
    });
  }
});

// Send campaign approved notification SMS
router.post("/campaign-approved", async (req, res) => {
  try {
    const { recipientNumber, campaignTitle } = req.body;
    
    if (!recipientNumber || !campaignTitle) {
      return res.status(400).json({
        success: false,
        error: "recipientNumber and campaignTitle are required"
      });
    }
    
    const result = await sendCampaignApprovedSMS(recipientNumber, campaignTitle);
    
    if (result.success) {
      return res.json({
        success: true,
        message: "Campaign approved SMS sent successfully",
        data: result.data
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error("Campaign approved SMS error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message
    });
  }
});

export default router;

