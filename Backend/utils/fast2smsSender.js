import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.FAST2SMS_API_KEY;
const SENDER_ID = process.env.FAST2SMS_SENDER_ID;   // must be approved & 6 letters only
const API_URL = "https://www.fast2sms.com/dev/bulkV2";

export const sendSMS = async (mobile, message) => {
    try {
        if (!API_KEY) {
            throw new Error("FAST2SMS_API_KEY missing from .env");
        }
        if (!SENDER_ID) {
            throw new Error("FAST2SMS_SENDER_ID missing or not approved");
        }

        // Clean number
        let number = mobile.replace(/[+\s-]/g, "");
        if (number.length === 10) number = "91" + number;

        const payload = {
            route: "v3",               // REQUIRED for transactional/promo
            sender_id: SENDER_ID,      // Must be approved in Fast2SMS
            message: message,
            language: "english",
            numbers: number
        };

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                Authorization: API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        console.log("Fast2SMS Response:", result);

        if (result.return === true) {
            return { success: true, requestId: result.request_id };
        }

        return { success: false, error: result.message };

    } catch (err) {
        console.error("Fast2SMS Error:", err);
        return { success: false, error: err.message };
    }
};
