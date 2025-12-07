// components/WhatsAppTest.jsx
import React, { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

export default function WhatsAppTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [recipientNumber, setRecipientNumber] = useState("15550440443"); // Test number: +1 555 044 0443 (use your number: 917058733358 after adding to allowed list)
  const [message, setMessage] = useState("Hello! Your WhatsApp Notification from my website is working 🚀");

  const sendTestNotification = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await axios.post(`${API_URL}/api/whatsapp/test`, {
        recipientNumber,
        message
      });

      if (response.data.success) {
        setResult({
          type: "success",
          message: "✅ WhatsApp notification sent successfully!",
          data: response.data
        });
      } else {
        setResult({
          type: "error",
          message: "❌ Failed to send notification",
          error: response.data.error || response.data.message
        });
      }
    } catch (error) {
      setResult({
        type: "error",
        message: "❌ Error sending notification",
        error: error.response?.data?.error || error.message || "Network error"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#003d3b] mb-2 flex items-center gap-2">
          <span className="text-3xl">📱</span>
          WhatsApp Notification Test
        </h2>
        <p className="text-gray-600">
          Test your WhatsApp Cloud API integration
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-[#003d3b] mb-2">
            Recipient Phone Number (with country code, no +)
          </label>
          <input
            type="text"
            value={recipientNumber}
            onChange={(e) => setRecipientNumber(e.target.value)}
            placeholder="917058733358"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition"
          />
          <p className="text-xs text-gray-500 mt-1">Format: Country code + number (e.g., 917058733358 for India)</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#003d3b] mb-2">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows="4"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition"
            placeholder="Enter your message here..."
          />
        </div>

        <button
          onClick={sendTestNotification}
          disabled={loading || !recipientNumber || !message}
          className="w-full bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#128C7E] hover:to-[#075E54] text-white font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Sending...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Send WhatsApp Notification
            </>
          )}
        </button>

        {result && (
          <div className={`p-4 rounded-xl border-2 ${
            result.type === "success" 
              ? "bg-green-50 border-green-200 text-green-800" 
              : "bg-red-50 border-red-200 text-red-800"
          }`}>
            <p className="font-semibold mb-2">{result.message}</p>
            {result.error && (
              <p className="text-sm">{result.error}</p>
            )}
            {result.data && (
              <pre className="text-xs mt-2 bg-white/50 p-2 rounded overflow-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-800 font-semibold mb-2">💡 How to Test:</p>
          <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
            <li>Enter recipient phone number (with country code)</li>
            <li>Enter your test message</li>
            <li>Click "Send WhatsApp Notification"</li>
            <li>Check the recipient's WhatsApp for the message</li>
            <li>Verify success/error message appears</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

