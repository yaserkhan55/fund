import React, { useState } from "react";
import api from "../lib/api";

export default function DonationModal({ campaignId, onClose }) {
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleDonation = async () => {
    setError("");
    setSuccess("");

    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid donation amount.");
      return;
    }
    if (!name.trim() || !phone.trim()) {
      setError("Name and phone number are required.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/api/donations/create", {
        campaignId,
        amount: Number(amount),
        name,
        phone,
      });

      if (res.data?.success) {
        setSuccess("Thank you! Your donation was successful.");
        setAmount("");
        setName("");
        setPhone("");

        setTimeout(() => onClose(), 1500);
      } else {
        setError(res.data?.message || "Donation failed.");
      }
    } catch (err) {
      console.error("Donation error:", err);
      setError("Something went wrong while processing the donation.");
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-[95%] max-w-md">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#003d3b]">Donate to Campaign</h2>
          <button className="text-gray-600 hover:text-black text-2xl" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* SUCCESS MESSAGE */}
        {success && <p className="text-green-600 font-medium mb-3 text-center">{success}</p>}

        {/* ERROR MESSAGE */}
        {error && <p className="text-red-500 font-medium mb-3 text-center">{error}</p>}

        {/* AMOUNT */}
        <label className="block mb-2 text-sm font-semibold">Donation Amount (₹)</label>
        <input
          type="number"
          className="w-full border rounded-lg p-2 mb-4"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
        />

        {/* NAME */}
        <label className="block mb-2 text-sm font-semibold">Your Name</label>
        <input
          type="text"
          className="w-full border rounded-lg p-2 mb-4"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
        />

        {/* PHONE */}
        <label className="block mb-2 text-sm font-semibold">Phone Number</label>
        <input
          type="text"
          className="w-full border rounded-lg p-2 mb-4"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Enter phone number"
        />

        {/* DONATE BUTTON */}
        <button
          className="w-full bg-[#00695c] text-white px-5 py-3 rounded-xl mt-4 font-semibold shadow-md hover:bg-[#005248] transition-all duration-300 active:scale-95"
          onClick={handleDonation}
          disabled={loading}
        >
          {loading ? "Processing..." : "❤️ Donate Now"}
        </button>
      </div>
    </div>
  );
}
