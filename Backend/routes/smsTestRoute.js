// routes/smsTestRoute.js
import express from "express";
import { sendSimpleSMS } from "../utils/fast2smsOTP.js";

const router = express.Router();

router.post("/test-simple", async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ success: false, message: "phone required" });
  }

  const result = await sendSimpleSMS(phone);

  return res.json({
    success: true,
    result,
  });
});

export default router;
