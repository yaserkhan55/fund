// routes/smsRoutes.js
import express from "express";
import {
  sendFast2SMS,
  sendDonationThankYouSMS,
  sendCampaignCreatedSMS,
  sendCampaignApprovedSMS
} from "../utils/fast2smsSender.js";

const router = express.Router();

/* =====================================================
   TEST SMS (Simple plain-text message)
===================================================== */
router.post("/test", async (req, res) => {
  try {
    const { recipientNumber, message } = req.body;

    const to = recipientNumber || "917058733358";
    const text = message || "Test SMS: SEUMP notification working";

    const result = await sendFast2SMS(to, text);

    return res.json(result);
  } catch (error) {
    console.error("SMS Test Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/* =====================================================
   DONATION THANK YOU SMS
===================================================== */
router.post("/donation-thank-you", async (req, res) => {
  try {
    const { recipientNumber, donorName, amount } = req.body;

    if (!recipientNumber || !donorName || !amount) {
      return res.status(400).json({
        success: false,
        error: "recipientNumber, donorName, and amount are required"
      });
    }

    const result = await sendDonationThankYouSMS(
      recipientNumber,
      donorName,
      amount
    );

    return res.json(result);
  } catch (error) {
    console.error("Donation SMS Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/* =====================================================
   CAMPAIGN CREATED SMS
===================================================== */
router.post("/campaign-created", async (req, res) => {
  try {
    const { recipientNumber, campaignTitle } = req.body;

    if (!recipientNumber || !campaignTitle) {
      return res.status(400).json({
        success: false,
        error: "recipientNumber and campaignTitle are required"
      });
    }

    const result = await sendCampaignCreatedSMS(
      recipientNumber,
      campaignTitle
    );

    return res.json(result);
  } catch (error) {
    console.error("Campaign Created SMS Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/* =====================================================
   CAMPAIGN APPROVED SMS
===================================================== */
router.post("/campaign-approved", async (req, res) => {
  try {
    const { recipientNumber, campaignTitle } = req.body;

    if (!recipientNumber || !campaignTitle) {
      return res.status(400).json({
        success: false,
        error: "recipientNumber and campaignTitle are required"
      });
    }

    const result = await sendCampaignApprovedSMS(
      recipientNumber,
      campaignTitle
    );

    return res.json(result);
  } catch (error) {
    console.error("Campaign Approved SMS Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
