import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

const baseForm = {
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
};

const resolveFileLabel = (path = "") => path.split("/").pop() || "document";

const resolveImg = (img) => {
  if (!img) return "/no-image.png";
  if (img.startsWith("http")) return img;
  const base = import.meta.env.VITE_API_URL;
  return `${base}/${img.replace(/^\/+/, "")}`;
};

export default function EditCampaign() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSignedIn, getToken } = useAuth();

  const [formData, setFormData] = useState(baseForm);
  const [existingImage, setExistingImage] = useState("");
  const [newImage, setNewImage] = useState(null);
  const [newDocuments, setNewDocuments] = useState([]);
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchToken = async () => {
    try {
      const token = await getToken();
      if (token) return token;
    } catch (err) {
      // ignore
    }
    return localStorage.getItem("token");
  };

  useEffect(() => {
    if (!isSignedIn) {
      setError("Please sign in to edit your fundraiser.");
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const token = await fetchToken();
        if (!token) {
          throw new Error("Session expired. Please sign in again.");
        }

        const res = await axios.get(`${API_URL}/api/campaigns/${id}/owner`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const campaign = res.data?.campaign;
        if (!campaign) {
          throw new Error("Campaign not found.");
        }

        setFormData({
          title: campaign.title || "",
          shortDescription: campaign.shortDescription || "",
          fullStory: campaign.fullStory || "",
          goalAmount: campaign.goalAmount || "",
          category: campaign.category || "",
          beneficiaryName: campaign.beneficiaryName || "",
          city: campaign.city || "",
          relation: campaign.relation || "",
          zakatEligible: campaign.zakatEligible || false,
          educationQualification: campaign.educationQualification || "",
          employmentStatus: campaign.employmentStatus || "",
          duration: campaign.duration || "",
        });

        setExistingImage(campaign.image || campaign.imageUrl || "");
        setExistingDocuments(
          Array.isArray(campaign.documents) && campaign.documents.length
            ? campaign.documents
            : campaign.medicalDocuments || []
        );
        const requests = Array.isArray(campaign.infoRequests)
          ? campaign.infoRequests.filter((req) => req.status !== "resolved")
          : [];
        setPendingRequests(requests);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || err.message || "Failed to load campaign.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, isSignedIn]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    if (e.target.files?.length) {
      setNewImage(e.target.files[0]);
    }
  };

  const handleDocsChange = (e) => {
    setNewDocuments(Array.from(e.target.files || []));
  };

  const pendingMessages = useMemo(
    () => pendingRequests.map((req) => req.message).filter(Boolean),
    [pendingRequests]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = await fetchToken();
      if (!token) {
        throw new Error("Session expired. Please sign in again.");
      }

      const fd = new FormData();
      Object.entries(formData).forEach(([key, value]) => fd.append(key, value ?? ""));
      if (newImage) {
        fd.append("image", newImage);
      }
      newDocuments.forEach((doc) => fd.append("documents", doc));

      await axios.put(`${API_URL}/api/campaigns/${id}/update`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess("Campaign updated. Redirecting back to dashboard...");
      setTimeout(() => navigate("/profile"), 1500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Failed to update campaign.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16">
        <div className="max-w-3xl mx-auto text-center text-gray-600">Loading campaign...</div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-xl p-8">
        <header className="mb-8">
          <p className="uppercase text-xs tracking-[0.4em] text-[#00B5B8] font-semibold">
            Update Fundraiser
          </p>
          <h1 className="text-3xl font-bold text-[#003d3b] mt-2">Edit campaign details</h1>
          {pendingMessages.length > 0 && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900 space-y-2">
              <p className="font-semibold">Admin needs the following:</p>
              <ul className="list-disc pl-5 space-y-1">
                {pendingMessages.map((msg, idx) => (
                  <li key={idx}>{msg}</li>
                ))}
              </ul>
            </div>
          )}
        </header>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold text-[#003d3b] mb-1">Goal Amount *</label>
              <input
                type="number"
                name="goalAmount"
                value={formData.goalAmount}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#00B5B8]"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-[#003d3b] mb-1">Duration (days)</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#00B5B8]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold text-[#003d3b] mb-1">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#00B5B8]"
                required
              >
                <option value="">Select category</option>
                <option value="medical">Medical</option>
                <option value="education">Education</option>
                <option value="emergency">Emergency</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#003d3b] mb-1">Relation *</label>
              <select
                name="relation"
                value={formData.relation}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#00B5B8]"
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold text-[#003d3b] mb-1">Education *</label>
              <select
                name="educationQualification"
                value={formData.educationQualification}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#00B5B8]"
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
            <div>
              <label className="block font-semibold text-[#003d3b] mb-1">Employment *</label>
              <select
                name="employmentStatus"
                value={formData.employmentStatus}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#00B5B8]"
                required
              >
                <option value="">Select status</option>
                <option value="employed">Employed</option>
                <option value="self-employed">Self Employed</option>
                <option value="student">Student</option>
                <option value="unemployed">Unemployed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#003d3b] mb-1">Fundraiser Title *</label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#00B5B8]"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-[#003d3b] mb-1">Short Description *</label>
            <textarea
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleChange}
              rows={3}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#00B5B8]"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-[#003d3b] mb-1">Full Story *</label>
            <textarea
              name="fullStory"
              value={formData.fullStory}
              onChange={handleChange}
              rows={5}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#00B5B8]"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold text-[#003d3b] mb-1">Beneficiary Name *</label>
              <input
                name="beneficiaryName"
                value={formData.beneficiaryName}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#00B5B8]"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-[#003d3b] mb-1">City *</label>
              <input
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#00B5B8]"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="zakat"
              type="checkbox"
              name="zakatEligible"
              checked={!!formData.zakatEligible}
              onChange={handleChange}
              className="h-4 w-4 text-[#00B5B8] border-gray-300 rounded focus:ring-[#00B5B8]"
            />
            <label htmlFor="zakat" className="text-sm text-gray-600">
              Mark this campaign as Zakat eligible
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold text-[#003d3b] mb-2">
                Current Banner Image
              </label>
              {existingImage ? (
                <img
                  src={resolveImg(existingImage)}
                  alt="Current banner"
                  className="h-48 w-full object-cover rounded-xl border"
                />
              ) : (
                <p className="text-sm text-gray-500">No image uploaded yet.</p>
              )}
            </div>
            <div>
              <label className="block font-semibold text-[#003d3b] mb-2">Upload new image</label>
              <input type="file" accept="image/*" onChange={handleImageChange} className="w-full" />
              <p className="text-xs text-gray-500 mt-1">
                Optional. Upload only if you want to replace the banner.
              </p>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#003d3b] mb-2">
              Existing documents ({existingDocuments.length})
            </label>
            {existingDocuments.length === 0 ? (
              <p className="text-sm text-gray-500">No documents uploaded yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {existingDocuments.map((doc, idx) => (
                  <a
                    key={`${doc}-${idx}`}
                    href={resolveImg(doc)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-[#005A58]"
                  >
                    {resolveFileLabel(doc)}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-[#003d3b] mb-1">
              Upload additional documents
            </label>
            <input type="file" multiple onChange={handleDocsChange} className="w-full" />
            <p className="text-xs text-gray-500 mt-1">
              Add bills, prescriptions or ID proofs that the admin asked for.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#00B5B8] text-white py-3 rounded-xl font-bold text-lg shadow-md hover:bg-[#009EA1] transition disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save campaign"}
          </button>
        </form>
      </div>
    </section>
  );
}

