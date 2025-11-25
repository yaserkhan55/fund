import twilio from "twilio";

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
} = process.env;

let twilioClient = null;

if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
} else {
  console.warn(
    "⚠️  Twilio environment variables missing. SMS notifications are disabled."
  );
}

const normalizePhone = (input) => {
  if (!input) return null;
  const trimmed = `${input}`.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("+")) return trimmed;
  // Default to Indian country code when no prefix is supplied
  if (/^\d{10}$/.test(trimmed)) return `+91${trimmed}`;
  if (trimmed.startsWith("0") && trimmed.length === 11) {
    return `+91${trimmed.slice(1)}`;
  }
  return trimmed;
};

export const sendSms = async (to, body) => {
  if (!twilioClient) return;
  const phone = normalizePhone(to);
  if (!phone) return;
  if (!body) return;

  try {
    await twilioClient.messages.create({
      body,
      from: TWILIO_PHONE_NUMBER,
      to: phone,
    });
  } catch (error) {
    console.error("SMS send error:", error.message || error);
  }
};


