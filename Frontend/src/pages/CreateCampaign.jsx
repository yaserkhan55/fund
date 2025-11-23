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

      const res = await api.post(`/api/campaigns/create`, fd, {
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

      {/* ---------- Custom Popup ---------- */}
      {popup.show && (
        <div
          className={`
            fixed top-6 left-1/2 transform -translate-x-1/2 
            px-6 py-3 rounded-xl shadow-xl text-white text-lg font-semibold
            transition-all z-50
            ${
              popup.type === "success"
                ? "bg-[#00AEEF]"
                : "bg-red-500"
            }
          `}
        >
          {popup.message}
        </div>
      )}

      <div className="w-[95%] md:w-[80%] lg:w-[60%] bg-white shadow-xl p-6 md:p-8 rounded-2xl border border-[#00AEEF]/20">

        <h2 className="text-3xl font-bold text-[#003D3B] mb-8 text-center">
          Start a Fundraiser
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* TITLE */}
          <div>
            <label className="block bg-[#FFFBF0] px-3 py-1 rounded-md font-semibold text-[#003D3B] shadow-sm mb-1">
              Fundraiser Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#00AEEF] outline-none"
              required
            />
          </div>

          {/* ZAKAT */}
          <label className="flex items-center gap-2 bg-[#E6F5F3] px-3 py-2 rounded-lg shadow-sm">
            <input
              type="checkbox"
              name="zakatEligible"
              checked={!!formData.zakatEligible}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, zakatEligible: e.target.checked }))
              }
            />
            <span className="font-semibold text-[#003D3B]">
              Zakat Eligible?
            </span>
          </label>

          {/* SHORT DESC */}
          <div>
            <label className="block bg-[#FFFBF0] px-3 py-1 rounded-md font-semibold text-[#003D3B] shadow-sm mb-1">
              Short Description
            </label>
            <textarea
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#00AEEF] outline-none"
              required
            />
          </div>

          {/* FULL STORY */}
          <div>
            <label className="block bg-[#FFFBF0] px-3 py-1 rounded-md font-semibold text-[#003D3B] shadow-sm mb-1">
              Full Story
            </label>
            <textarea
              name="fullStory"
              value={formData.fullStory}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#00AEEF] outline-none"
              rows="5"
              required
            />
          </div>

          {/* GOAL + CATEGORY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block bg-[#FFFBF0] px-3 py-1 rounded-md font-semibold text-[#003D3B] shadow-sm mb-1">
                Goal Amount
              </label>
              <input
                type="number"
                name="goalAmount"
                value={formData.goalAmount}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#00AEEF]"
                required
              />
            </div>

            <div>
              <label className="block bg-[#FFFBF0] px-3 py-1 rounded-md font-semibold text-[#003D3B] shadow-sm mb-1">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#00AEEF]"
                required
              >
                <option value="">Select Category</option>
                <option value="medical">Medical</option>
                <option value="education">Education</option>
                <option value="emergency">Emergency</option>
                <option value="animals">Animals</option>
              </select>
            </div>
          </div>

          {/* BENEFICIARY + CITY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block bg-[#FFFBF0] px-3 py-1 rounded-md font-semibold text-[#003D3B] shadow-sm mb-1">
                Beneficiary Name
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
              <label className="block bg-[#FFFBF0] px-3 py-1 rounded-md font-semibold text-[#003D3B] shadow-sm mb-1">
                City
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

          {/* RELATION */}
          <div>
            <label className="block bg-[#FFFBF0] px-3 py-1 rounded-md font-semibold text-[#003D3B] shadow-sm mb-1">
              Relation
            </label>
            <input
              name="relation"
              value={formData.relation}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#00AEEF]"
              required
            />
          </div>

          {/* IMAGE */}
          <div>
            <label className="block bg-[#FFFBF0] px-3 py-1 rounded-md font-semibold text-[#003D3B] shadow-sm mb-1">
              Upload Banner Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full p-2"
              required
            />
          </div>

          {/* DOCUMENTS */}
          <div>
            <label className="block bg-[#FFFBF0] px-3 py-1 rounded-md font-semibold text-[#003D3B] shadow-sm mb-1">
              Upload Documents (Optional)
            </label>
            <input type="file" multiple onChange={handleDocsChange} className="w-full p-2" />
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00AEEF] text-white py-3 rounded-xl font-bold text-lg 
            shadow-md hover:bg-[#0099D6] active:scale-[0.98] transition"
          >
            {loading ? "Submitting..." : "Create Fundraiser"}
          </button>
        </form>
      </div>
    </div>
  );
}
