const BASE_URL = "https://fund-tcba.onrender.com";

export const sendOtp = async (email) => {
  console.log("sendOtp called with:", email);
  const res = await fetch(`${BASE_URL}/api/email-otp/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json().catch(() => null);
};

export const verifyOtp = async (email, otp) => {
  console.log("verifyOtp called with:", email, otp);
  const res = await fetch(`${BASE_URL}/api/email-otp/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  return res.json().catch(() => null);
};


