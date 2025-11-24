import React, { useState } from "react";
import api from "../lib/api";

export default function CreateCampaign() {
  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    fullStory: "",
    goalAmount: "",
    category: "",
    beneficiaryName: "",
    city: "",
    relation: "",
    zakatEligible: false,
    educationQualification: "",
    employmentStatus: "",
    duration: "",
  });

  const [image, setImage] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  const [popup, setPopup] = useState({ show: false, type: "", message: "" });

  const showPopup = (type, message) => {
    setPopup({ show: true, type, message });
    setTimeout(() => setPopup({ show: false, type: "", message: "" }), 3000);
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    if (e.target.files.length > 0) setImage(e.target.files[0]);
  };

  const handleDocsChange = (e) => {
    setDocuments(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.keys(formData).forEach((key) => fd.append(key, formData[key]));

      if (image) fd.append("image", image);
      documents.forEach((doc) => fd.append("documents", doc));

      const token = localStorage.getItem("token");

      await api.post(`/api/campaigns/create`, fd, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      showPopup("success", "🎉 Fundraiser Created Successfully!");
      setTimeout(() => (window.location.href = "/"), 1200);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to create campaign.";
      showPopup("error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex justify-center py-10 relative">

      {/* ---------- Popup ---------- */}
      {popup.show && (
        <div
          className={`
            fixed top-6 left-1/2 transform -translate-x-1/2 
            px-6 py-3 rounded-xl shadow-xl text-white text-lg font-semibold
            transition-all z-50
            ${popup.type === "success" ? "bg-[#00AEEF]" : "bg-red-500"}
          `}
        >
          {popup.message}
        </div>
      )}

      <div className="w-[95%] md:w-[80%] lg:w-[60%] bg-white shadow-xl p-6 md:p-8 rounded-2xl border border-[#00AEEF]/20">

        <h2 className="text-3xl font-bold text-[#003D3B] mb-8 text-center">
          Tell us more about your Fundraiser
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* GOAL AMOUNT */}
          <div>
            <label className="block font-semibold text-[#003D3B] mb-1">
              How much do you want to raise? *
            </label>
            <input
              type="number"
              name="goalAmount"
              value={formData.goalAmount}
              onChange={handleChange}
              placeholder="Minimum ₹ 2000"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#00AEEF]"
              required
            />
          </div>

          {/* RELATION */}
          <div>
            <label className="block font-semibold text-[#003D3B] mb-1">
              The Patient is my… *
            </label>
            <select
              name="relation"
              value={formData.relation}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#00AEEF]"
              required
            >
              <option value="">Select relation</option>
              <option value="self">Self</option>
              <option value="father">Father</option>
              <option value="mother">Mother</option>
              <option value="relative">Relative</option>
              <option value="friend">Friend</option>
            </select>
          </div>

          {/* EDUCATION */}
          <div>
            <label className="block font-semibold text-[#003D3B] mb-1">
              Your Education Qualification *
            </label>
            <select
              name="educationQualification"
              value={formData.educationQualification}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#00AEEF]"
              required
            >
              <option value="">Select education level</option>
              <option value="10th">10th Pass</option>
              <option value="12th">12th Pass</option>
              <option value="graduate">Graduate</option>
              <option value="postgraduate">Post Graduate</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* EMPLOYMENT */}
          <div>
            <label className="block font-semibold text-[#003D3B] mb-1">
              Your Employment Status *
            </label>
            <select
              name="employmentStatus"
              value={formData.employmentStatus}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#00AEEF]"
              required
            >
              <option value="">Select status</option>
              <option value="employed">Employed</option>
              <option value="self-employed">Self Employed</option>
              <option value="student">Student</option>
              <option value="unemployed">Unemployed</option>
            </select>
          </div>

          {/* DURATION */}
          <div>
            <label className="block font-semibold text-[#003D3B] mb-1">
              Fundraiser Duration (in days) *
            </label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              placeholder="Example: 30"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#00AEEF]"
              required
            />
          </div>

          {/* TITLE */}
          <div>
            <label className="block font-semibold text-[#003D3B] mb-1">
              Fundraiser Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#00AEEF]"
              required
            />
          </div>

          {/* SHORT DESC */}
          <div>
            <label className="block font-semibold text-[#003D3B] mb-1">
              Short Description *
            </label>
            <textarea
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#00AEEF]"
              required
            />
          </div>

          {/* FULL STORY */}
          <div>
            <label className="block font-semibold text-[#003D3B] mb-1">
              Full Story *
            </label>
            <textarea
              name="fullStory"
              value={formData.fullStory}
              onChange={handleChange}
              rows="5"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#00AEEF]"
              required
            />
          </div>

          {/* BENEFICIARY + CITY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold text-[#003D3B] mb-1">
                Beneficiary Name *
              </label>
              <input
                name="beneficiaryName"
                value={formData.beneficiaryName}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#00AEEF]"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-[#003D3B] mb-1">
                City *
              </label>
              <input
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#00AEEF]"
                required
              />
            </div>
          </div>

          {/* IMAGE UPLOAD */}
          <div>
            <label className="block font-semibold text-[#003D3B] mb-1">
              Upload Banner Image *
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full p-2"
              required
            />
          </div>

          {/* DOCUMENT UPLOAD */}
          <div>
            <label className="block font-semibold text-[#003D3B] mb-1">
              Upload Documents (Optional)
            </label>
            <input
              type="file"
              multiple
              onChange={handleDocsChange}
              className="w-full p-2"
            />
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00AEEF] text-white py-3 rounded-xl font-bold text-lg 
              shadow-md hover:bg-[#0099D6] transition"
          >
            {loading ? "Submitting..." : "Create Fundraiser"}
          </button>
        </form>
      </div>
    </div>
  );
}
