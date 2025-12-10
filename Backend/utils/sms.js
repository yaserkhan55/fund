// utils/sms.js
import smsProvider from "./smsProvider.js"; // Your Twilio or other provider

/**
 * Send SMS to one or many phone numbers safely.
 * - Accepts string or array of strings
 * - Never throws (returns success flags instead)
 */
export const sendSms = async ({ numbers, message }) => {
  if (!numbers) return { success: false, error: "NO_NUMBERS" };

  const list = Array.isArray(numbers)
    ? numbers
    : [numbers]; // allow single or multiple

  const results = [];

  for (const num of list) {
    if (!num) {
      results.push({ number: num, success: false, error: "INVALID_NUMBER" });
      continue;
    }

    try {
      const r = await smsProvider.send({
        to: num,
        message,
      });

      results.push({ number: num, success: true, result: r });
    } catch (err) {
      console.error("SMS ERROR:", err);
      results.push({
        number: num,
        success: false,
        error: err.message || err,
      });
    }
  }

  return {
    success: results.every((r) => r.success),
    results,
  };
};
