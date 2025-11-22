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

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    if (e.target.files.length > 0) {
      setImage(e.target.files[0]);
    }
  };

  const handleDocsChange = (e) => {
    const files = Array.from(e.target.files);
    setDocuments(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fd = new FormData();

      Object.keys(formData).forEach((key) => {
        fd.append(key, formData[key]);
      });

      if (image) fd.append("image", image);
        documents.forEach((doc) => fd.append("documents", doc));

      const res = await api.post(`/api/campaigns/create`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Fundraiser Successfully Created!");
      window.location.href = "/";

    } catch (error) {
      console.error(error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to create campaign.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex justify-center py-10">
      <div className="w-[95%] md:w-[80%] lg:w-[60%] bg-white shadow-lg p-6 md:p-8 rounded-xl">
        <h2 className="text-2xl md:text-3xl font-bold text-[#0A2342] mb-6">
          Start a Fundraiser
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="font-semibold">Fundraiser Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
            required
          />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="zakatEligible"
              checked={!!formData.zakatEligible}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, zakatEligible: e.target.checked }))
              }
            />
            <span className="font-semibold">Zakat Eligible?</span>
          </label>

          <label className="font-semibold">Short Description</label>
          <textarea
            name="shortDescription"
            value={formData.shortDescription}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
            required
          />

          <label className="font-semibold">Full Story</label>
          <textarea
            name="fullStory"
            value={formData.fullStory}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
            rows="5"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold">Goal Amount</label>
              <input
                type="number"
                name="goalAmount"
                value={formData.goalAmount}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="font-semibold">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="beneficiaryName"
              value={formData.beneficiaryName}
              onChange={handleChange}
              placeholder="Beneficiary Name"
              className="w-full p-3 border rounded-lg"
              required
            />
            <input
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="City"
              className="w-full p-3 border rounded-lg"
              required
            />
          </div>

          <label className="font-semibold">Relation</label>
          <input
            name="relation"
            value={formData.relation}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
            required
          />

          <label className="font-semibold">Upload Banner Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full p-2"
            required
          />

          <label className="font-semibold">Upload Documents (Optional)</label>
          <input
            type="file"
            multiple
            onChange={handleDocsChange}
            className="w-full p-2"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0A2342] text-white py-3 rounded-lg hover:bg-[#0C2E5B] transition"
          >
            {loading ? "Submitting..." : "Create Fundraiser"}
          </button>
        </form>
      </div>
    </div>
  );
}
