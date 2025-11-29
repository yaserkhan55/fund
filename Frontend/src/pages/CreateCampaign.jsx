import React, { useState, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

export default function CreateCampaign() {
  const { isSignedIn, getToken } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    fullStory: "",
    goalAmount: "",
    category: "",
    beneficiaryName: "",
    beneficiarySurname: "",
    city: "",
    relation: "",
    zakatEligible: false,
    zakatCategory: "",
    islamicAffirmation: false,
    educationQualification: "",
    employmentStatus: "",
    duration: "",
    phoneNumber: "",
    alternateContact: "",
    bankAccountName: "",
    bankAccountNumber: "",
    idProofType: "",
    idProofNumber: "",
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [formProgress, setFormProgress] = useState(0);

  const [popup, setPopup] = useState({ show: false, type: "", message: "" });
  const imageInputRef = useRef(null);
  const docsInputRef = useRef(null);

  const showPopup = (type, message) => {
    setPopup({ show: true, type, message });
    setTimeout(() => setPopup({ show: false, type: "", message: "" }), 3000);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
    // Calculate progress
    calculateProgress();
  };

  const calculateProgress = () => {
    const fields = [
      "title",
      "shortDescription",
      "fullStory",
      "goalAmount",
      "category",
      "beneficiaryName",
      "city",
      "relation",
      "educationQualification",
      "employmentStatus",
      "duration",
    ];
    const filled = fields.filter((f) => formData[f]).length;
    const hasImage = image ? 1 : 0;
    const hasDocs = documents.length > 0 ? 1 : 0;
    const total = fields.length + 2;
    const progress = ((filled + hasImage + hasDocs) / total) * 100;
    setFormProgress(Math.round(progress));
  };

  const validateForm = () => {
    const newErrors = {};

    // Title validation (more strict)
    if (!formData.title || formData.title.trim().length < 15) {
      newErrors.title = "Title must be at least 15 characters. Please provide a more descriptive title.";
    }

    // Description validation (more strict)
    if (!formData.shortDescription || formData.shortDescription.trim().length < 30) {
      newErrors.shortDescription = "Short description must be at least 30 characters. Please provide more details.";
    }

    // Full story validation (more strict)
    if (!formData.fullStory || formData.fullStory.trim().length < 100) {
      newErrors.fullStory = "Full story must be at least 100 characters. Please provide a comprehensive description.";
    }

    // Goal amount validation (increased minimum)
    const goal = parseFloat(formData.goalAmount);
    if (!goal || goal < 5000) {
      newErrors.goalAmount = "Minimum goal amount is ₹5,000";
    }
    if (goal > 50000000) {
      newErrors.goalAmount = "Maximum goal amount is ₹5,00,00,000";
    }

    // Beneficiary name validation
    if (!formData.beneficiaryName || formData.beneficiaryName.trim().length < 2) {
      newErrors.beneficiaryName = "Please enter the full name of the beneficiary";
    }

    // Phone number validation (if provided)
    if (formData.phoneNumber && formData.phoneNumber.trim()) {
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(formData.phoneNumber.replace(/\D/g, ""))) {
        newErrors.phoneNumber = "Please enter a valid 10-digit mobile number";
      }
    }

    // Zakat validation
    if (formData.zakatEligible) {
      if (!formData.zakatCategory) {
        newErrors.zakatCategory = "Please select a Zakat category";
      }
      if (!formData.islamicAffirmation) {
        newErrors.islamicAffirmation = "Islamic affirmation is required for Zakat-eligible campaigns";
      }
    }

    // Duration validation (increased minimum)
    const duration = parseInt(formData.duration);
    if (!duration || duration < 14) {
      newErrors.duration = "Minimum duration is 14 days";
    }
    if (duration > 365) {
      newErrors.duration = "Maximum duration is 365 days";
    }

    // Image validation
    if (!image) {
      newErrors.image = "Please upload a banner image";
    } else {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (image.size > maxSize) {
        newErrors.image = "Image size must be less than 5MB";
      }
    }

    // Documents validation
    if (documents.length === 0) {
      newErrors.documents = "Please upload at least one supporting document";
    } else {
      documents.forEach((doc, idx) => {
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (doc.size > maxSize) {
          newErrors.documents = `Document ${idx + 1} size must be less than 10MB`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, image: "Image size must be less than 5MB" });
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      if (errors.image) {
        setErrors({ ...errors, image: "" });
      }
      calculateProgress();
    }
  };

  const handleDocsChange = (e) => {
    const files = Array.from(e.target.files);
    const invalidFiles = files.filter((f) => f.size > 10 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      setErrors({ ...errors, documents: "Some files exceed 10MB limit" });
      return;
    }
    setDocuments(files);
    if (errors.documents) {
      setErrors({ ...errors, documents: "" });
    }
    calculateProgress();
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
    calculateProgress();
  };

  const removeDocument = (index) => {
    setDocuments(documents.filter((_, i) => i !== index));
    calculateProgress();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showPopup("error", "Please fix the errors in the form");
      return;
    }

    setLoading(true);
    try {
      if (!isSignedIn) {
        showPopup("error", "Please sign in to create a fundraiser.");
        setLoading(false);
        return;
      }

      let token = null;
      try {
        token = await getToken();
      } catch (err) {
        token = localStorage.getItem("token");
      }

      if (!token) {
        showPopup("error", "Session expired. Please sign in again.");
        setLoading(false);
        return;
      }

      const fd = new FormData();
      Object.keys(formData).forEach((key) => fd.append(key, formData[key]));

      if (image) fd.append("image", image);
      documents.forEach((doc) => fd.append("documents", doc));

      await api.post(`/api/campaigns/create`, fd, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      showPopup("success", "🎉 Fundraiser Created Successfully! Under review...");
      setTimeout(() => (window.location.href = "/dashboard"), 2000);
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
    <div className="w-full min-h-screen bg-gradient-to-br from-[#F1FAFA] via-white to-[#E6F7F7] py-10 relative overflow-hidden">
      {/* Popup */}
      {popup.show && (
        <div
          className={`
            fixed top-6 left-1/2 transform -translate-x-1/2 
            px-6 py-3 rounded-xl shadow-xl text-white text-lg font-semibold
            transition-all z-50
            ${popup.type === "success" ? "bg-[#00B5B8]" : "bg-red-500"}
          `}
        >
          {popup.message}
        </div>
      )}

      {/* Background Logo */}
      <div className="fixed inset-0 opacity-[0.08] pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px]">
          <img
            src="/WhatsApp Image 2025-11-20 at 12.07.54 PM.jpeg"
            alt="SEUMP Logo"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* Main Container - Centered */}
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/90 backdrop-blur-md shadow-2xl p-6 md:p-8 rounded-2xl border border-[#00B5B8]/30">
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-[#003D3B] mb-2">
                  Start Your Fundraiser
                </h2>
                <p className="text-gray-600">
                  Fill in the details below. All information will be verified by our admin team.
                </p>
                
                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-[#003D3B]">
                      Form Progress
                    </span>
                    <span className="text-sm font-semibold text-[#00B5B8]">
                      {formProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#00B5B8] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${formProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* GOAL AMOUNT */}
                <div>
                  <label className="block font-semibold text-[#003D3B] mb-2">
                    How much do you want to raise? *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
                      ₹
                    </span>
                    <input
                      type="number"
                      name="goalAmount"
                      value={formData.goalAmount}
                      onChange={handleChange}
                      placeholder="Minimum ₹ 2,000"
                      min="2000"
                      max="10000000"
                      className={`w-full pl-8 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition ${
                        errors.goalAmount ? "border-red-300" : "border-gray-200"
                      }`}
                      required
                    />
                  </div>
                  {errors.goalAmount && (
                    <p className="text-red-500 text-sm mt-1">{errors.goalAmount}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Set a realistic goal. You can raise more if needed.
                  </p>
                </div>

                {/* CATEGORY */}
                <div>
                  <label className="block font-semibold text-[#003D3B] mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition"
                    required
                  >
                    <option value="">Select category</option>
                    <option value="medical">Medical</option>
                    <option value="education">Education</option>
                    <option value="emergency">Emergency</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* TITLE */}
                <div>
                  <label className="block font-semibold text-[#003D3B] mb-2">
                    Fundraiser Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Help John recover from cancer treatment"
                    maxLength={100}
                    className={`w-full p-3 border-2 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition ${
                      errors.title ? "border-red-300" : "border-gray-200"
                    }`}
                    required
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.title.length}/100 characters
                  </p>
                </div>

                {/* SHORT DESC */}
                <div>
                  <label className="block font-semibold text-[#003D3B] mb-2">
                    Short Description *
                  </label>
                  <textarea
                    name="shortDescription"
                    value={formData.shortDescription}
                    onChange={handleChange}
                    placeholder="Brief summary (will appear on campaign card)"
                    rows="3"
                    maxLength={200}
                    className={`w-full p-3 border-2 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition ${
                      errors.shortDescription ? "border-red-300" : "border-gray-200"
                    }`}
                    required
                  />
                  {errors.shortDescription && (
                    <p className="text-red-500 text-sm mt-1">{errors.shortDescription}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.shortDescription.length}/200 characters
                  </p>
                </div>

                {/* FULL STORY */}
                <div>
                  <label className="block font-semibold text-[#003D3B] mb-2">
                    Full Story *
                  </label>
                  <textarea
                    name="fullStory"
                    value={formData.fullStory}
                    onChange={handleChange}
                    placeholder="Tell your complete story. Include details about the person, their condition, medical history, treatment plan, and why you need help."
                    rows="6"
                    minLength={50}
                    className={`w-full p-3 border-2 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition ${
                      errors.fullStory ? "border-red-300" : "border-gray-200"
                    }`}
                    required
                  />
                  {errors.fullStory && (
                    <p className="text-red-500 text-sm mt-1">{errors.fullStory}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 50 characters. Be detailed and genuine.
                  </p>
                </div>

                {/* BENEFICIARY INFO - Islamic Names */}
                <div className="bg-gradient-to-r from-[#E6F5F3] to-[#F1FAFA] p-4 rounded-xl border border-[#00B5B8]/20 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-[#00B5B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <h3 className="font-bold text-[#003D3B]">Beneficiary Information (معلومات المستفيد)</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Please provide the complete name as per Islamic naming conventions (اسم كامل)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-semibold text-[#003D3B] mb-2">
                      Beneficiary First Name (الاسم الأول) *
                    </label>
                    <input
                      name="beneficiaryName"
                      value={formData.beneficiaryName}
                      onChange={handleChange}
                      placeholder="e.g., Muhammad, Fatima, Ahmed"
                      className={`w-full p-3 border-2 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition ${
                        errors.beneficiaryName ? "border-red-300" : "border-gray-200"
                      }`}
                      required
                    />
                    {errors.beneficiaryName && (
                      <p className="text-red-500 text-sm mt-1">{errors.beneficiaryName}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Enter the first/given name (اسم)
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#003D3B] mb-2">
                      Beneficiary Surname/Family Name (اسم العائلة)
                    </label>
                    <input
                      name="beneficiarySurname"
                      value={formData.beneficiarySurname}
                      onChange={handleChange}
                      placeholder="e.g., Khan, Ali, Sheikh, Ansari"
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Optional: Family name or tribal name (لقب)
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#003D3B] mb-2">
                      City *
                    </label>
                    <input
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="City name"
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition"
                      required
                    />
                  </div>
                </div>

                {/* RELATION */}
                <div>
                  <label className="block font-semibold text-[#003D3B] mb-2">
                    Your Relation to Beneficiary *
                  </label>
                  <select
                    name="relation"
                    value={formData.relation}
                    onChange={handleChange}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition"
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

                {/* PERSONAL INFO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-semibold text-[#003D3B] mb-2">
                      Your Education Qualification *
                    </label>
                    <select
                      name="educationQualification"
                      value={formData.educationQualification}
                      onChange={handleChange}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition"
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
                    <label className="block font-semibold text-[#003D3B] mb-2">
                      Your Employment Status *
                    </label>
                    <select
                      name="employmentStatus"
                      value={formData.employmentStatus}
                      onChange={handleChange}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition"
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

                {/* DURATION */}
                <div>
                  <label className="block font-semibold text-[#003D3B] mb-2">
                    Fundraiser Duration (in days) *
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    placeholder="Example: 30"
                    min="7"
                    max="365"
                    className={`w-full p-3 border-2 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition ${
                      errors.duration ? "border-red-300" : "border-gray-200"
                    }`}
                    required
                  />
                  {errors.duration && (
                    <p className="text-red-500 text-sm mt-1">{errors.duration}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 14 days, Maximum 365 days (increased minimum to prevent hasty submissions)
                  </p>
                </div>

                {/* ZAKAT ELIGIBLE - Enhanced Islamic Section */}
                <div className="bg-gradient-to-br from-[#E6F5F3] via-[#F0F9F8] to-[#E6F5F3] rounded-xl border-2 border-[#00B5B8]/30 p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <svg className="w-6 h-6 text-[#00B5B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[#003D3B] mb-1">
                        Zakat Eligibility (أهلية الزكاة)
                      </h3>
                      <p className="text-sm text-gray-700 mb-4">
                        Zakat (الزكاة) is one of the Five Pillars of Islam. If this campaign qualifies for Zakat according to Islamic principles, please mark it below.
                      </p>
                      
                      <div className="flex items-start gap-3 mb-4">
                        <input
                          type="checkbox"
                          name="zakatEligible"
                          checked={formData.zakatEligible}
                          onChange={handleChange}
                          className="w-5 h-5 text-[#00B5B8] rounded focus:ring-2 focus:ring-[#00B5B8] mt-1"
                        />
                        <label className="text-sm font-semibold text-[#003D3B] flex-1">
                          This campaign is eligible for Zakat (هذا الحملة مؤهلة للزكاة)
                        </label>
                      </div>

                      {formData.zakatEligible && (
                        <div className="space-y-4 mt-4 p-4 bg-white rounded-lg border border-[#00B5B8]/20">
                          <div>
                            <label className="block font-semibold text-[#003D3B] mb-2 text-sm">
                              Zakat Category (فئة الزكاة) *
                            </label>
                            <select
                              name="zakatCategory"
                              value={formData.zakatCategory}
                              onChange={handleChange}
                              className={`w-full p-3 border-2 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition ${
                                errors.zakatCategory ? "border-red-300" : "border-gray-200"
                              }`}
                              required={formData.zakatEligible}
                            >
                              <option value="">Select Zakat category</option>
                              <option value="poor">Poor (الفقراء) - Those who have insufficient wealth</option>
                              <option value="needy">Needy (المساكين) - Those in extreme need</option>
                              <option value="debtors">Debtors (الغارمين) - Those in debt</option>
                              <option value="wayfarers">Wayfarers (ابن السبيل) - Travelers in need</option>
                              <option value="new_muslims">New Muslims (المؤلفة قلوبهم) - New converts</option>
                              <option value="cause_of_allah">Cause of Allah (في سبيل الله) - For Islamic causes</option>
                            </select>
                            {errors.zakatCategory && (
                              <p className="text-red-500 text-sm mt-1">{errors.zakatCategory}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              Select the appropriate category according to Islamic jurisprudence (فقه)
                            </p>
                          </div>

                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <input
                                type="checkbox"
                                name="islamicAffirmation"
                                checked={formData.islamicAffirmation}
                                onChange={handleChange}
                                className={`w-5 h-5 text-[#00B5B8] rounded focus:ring-2 focus:ring-[#00B5B8] mt-0.5 ${
                                  errors.islamicAffirmation ? "border-red-500" : ""
                                }`}
                                required={formData.zakatEligible}
                              />
                              <label className="text-sm font-semibold text-[#003D3B]">
                                <span className="text-[#00B5B8] font-bold">Islamic Affirmation (التأكيد الإسلامي):</span>{" "}
                                I affirm that all information provided is truthful and accurate according to Islamic principles (أؤكد أن جميع المعلومات المقدمة صحيحة ودقيقة وفقاً للمبادئ الإسلامية). 
                                <span className="text-red-500">*</span>
                              </label>
                            </div>
                            {errors.islamicAffirmation && (
                              <p className="text-red-500 text-sm mt-1">{errors.islamicAffirmation}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ADDITIONAL VERIFICATION FIELDS */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <h3 className="font-bold text-[#003D3B]">Additional Verification (للتحقق الإضافي)</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    These fields help us verify your campaign and prevent fraud. All information is kept confidential.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-[#003D3B] mb-2 text-sm">
                        Contact Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        placeholder="10-digit mobile number"
                        maxLength="10"
                        className={`w-full p-3 border-2 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition ${
                          errors.phoneNumber ? "border-red-300" : "border-gray-200"
                        }`}
                      />
                      {errors.phoneNumber && (
                        <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
                      )}
                    </div>

                    <div>
                      <label className="block font-semibold text-[#003D3B] mb-2 text-sm">
                        Alternate Contact
                      </label>
                      <input
                        type="text"
                        name="alternateContact"
                        value={formData.alternateContact}
                        onChange={handleChange}
                        placeholder="Email or another phone"
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#003D3B] mb-2 text-sm">
                        Bank Account Holder Name
                      </label>
                      <input
                        type="text"
                        name="bankAccountName"
                        value={formData.bankAccountName}
                        onChange={handleChange}
                        placeholder="Name as per bank account"
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#003D3B] mb-2 text-sm">
                        Bank Account Last 4 Digits
                      </label>
                      <input
                        type="text"
                        name="bankAccountNumber"
                        value={formData.bankAccountNumber}
                        onChange={handleChange}
                        placeholder="Last 4 digits only"
                        maxLength="4"
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#003D3B] mb-2 text-sm">
                        ID Proof Type
                      </label>
                      <select
                        name="idProofType"
                        value={formData.idProofType}
                        onChange={handleChange}
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition"
                      >
                        <option value="">Select ID type</option>
                        <option value="aadhar">Aadhar Card</option>
                        <option value="pan">PAN Card</option>
                        <option value="passport">Passport</option>
                        <option value="driving_license">Driving License</option>
                        <option value="voter_id">Voter ID</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#003D3B] mb-2 text-sm">
                        ID Proof Last 4 Digits
                      </label>
                      <input
                        type="text"
                        name="idProofNumber"
                        value={formData.idProofNumber}
                        onChange={handleChange}
                        placeholder="Last 4 digits only"
                        maxLength="4"
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B5B8] focus:border-[#00B5B8] transition"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    ⚠️ This information is used for verification purposes only and is kept strictly confidential.
                  </p>
                </div>

                {/* IMAGE UPLOAD */}
                <div>
                  <label className="block font-semibold text-[#003D3B] mb-2">
                    Upload Banner Image * (Max 5MB)
                  </label>
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-xl border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => imageInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#00B5B8] transition"
                    >
                      <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-600 font-semibold">Click to upload image</p>
                      <p className="text-sm text-gray-500 mt-1">JPG, PNG or WEBP (Max 5MB)</p>
                    </div>
                  )}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    required
                  />
                  {errors.image && (
                    <p className="text-red-500 text-sm mt-1">{errors.image}</p>
                  )}
                </div>

                {/* DOCUMENT UPLOAD */}
                <div>
                  <label className="block font-semibold text-[#003D3B] mb-2">
                    Upload Supporting Documents * (Max 10MB each)
                  </label>
                  <div
                    onClick={() => docsInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-[#00B5B8] transition"
                  >
                    <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-600 font-semibold">Click to upload documents</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Medical reports, prescriptions, bills, etc. (PDF, JPG, PNG)
                    </p>
                  </div>
                  <input
                    ref={docsInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleDocsChange}
                    className="hidden"
                    required
                  />
                  {documents.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {documents.map((doc, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <span className="text-sm text-gray-700 truncate flex-1">
                            {doc.name} ({(doc.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                          <button
                            type="button"
                            onClick={() => removeDocument(idx)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {errors.documents && (
                    <p className="text-red-500 text-sm mt-1">{errors.documents}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Upload discharge summaries, prescriptions, medical bills, or any relevant documents to help verification.
                  </p>
                </div>

                {/* SUBMIT BUTTON */}
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#00B5B8] text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-[#009EA1] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Submitting...
                      </span>
                    ) : (
                      "Submit for Review"
                    )}
                  </button>

                  {/* Contact Us Button */}
                  <button
                    type="button"
                    onClick={() => {
                      // Scroll to footer contact form
                      const footer = document.querySelector('footer');
                      if (footer) {
                        footer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        // Focus on contact form input after scroll
                        setTimeout(() => {
                          const nameInput = document.querySelector('footer input[type="text"]');
                          if (nameInput) nameInput.focus();
                        }, 500);
                      }
                    }}
                    className="w-full bg-white border-2 border-[#00B5B8] text-[#00B5B8] py-3 rounded-xl font-semibold text-sm shadow-md hover:bg-[#00B5B8] hover:text-white transition"
                  >
                    Need Help? Contact Us
                  </button>
                </div>

                <p className="text-xs text-center text-gray-500">
                  Your campaign will be reviewed by our admin team before going live. This usually takes 24-48 hours.
                </p>
              </form>
            </div>
          </div>

          {/* Right Column - Guide Template */}
          <div className="lg:col-span-1">
            <div className="bg-white/90 backdrop-blur-md shadow-2xl p-6 rounded-2xl border border-[#00B5B8]/30 sticky top-24">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-[#003D3B] mb-2">
                  How to Fill This Form
                </h3>
                <p className="text-sm text-gray-600">
                  Follow these guidelines to create a successful fundraiser
                </p>
              </div>

              <div className="space-y-6">
                {/* Purpose Section */}
                <div className="bg-gradient-to-br from-[#E6F7F7] to-[#F1FAFA] p-5 rounded-xl border border-[#00B5B8]/20">
                  <h4 className="font-bold text-[#003D3B] mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#00B5B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Purpose of This Form
                  </h4>
                  <div className="space-y-3 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-[#00B5B8]">1.</span>
                      <div>
                        <p className="font-semibold">Post Genuine Information</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Share authentic details about the person, their condition, and payment information (GPay/PhonePe/Account details).
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-[#00B5B8]">2.</span>
                      <div>
                        <p className="font-semibold">Help People in Need</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Provide complete information so donors can make informed decisions and help effectively.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tips Section */}
                <div className="bg-amber-50 p-5 rounded-xl border border-amber-200">
                  <h4 className="font-bold text-[#8B5E00] mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Important Tips
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">•</span>
                      <span>Be honest and detailed in your story</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">•</span>
                      <span>Upload clear medical documents</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">•</span>
                      <span>Set a realistic fundraising goal</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">•</span>
                      <span>Include payment information if applicable</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">•</span>
                      <span>All information will be verified</span>
                    </li>
                  </ul>
                </div>

                {/* Fraud Prevention */}
                <div className="bg-red-50 p-5 rounded-xl border border-red-200">
                  <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Fraud Prevention
                  </h4>
                  <p className="text-sm text-red-700 mb-2">
                    We take fraud prevention seriously:
                  </p>
                  <ul className="space-y-1 text-xs text-red-700">
                    <li>• All campaigns are manually verified</li>
                    <li>• Documents are checked for authenticity</li>
                    <li>• Suspicious activity is flagged</li>
                    <li>• False information leads to permanent ban</li>
                  </ul>
                </div>

                {/* What Happens Next */}
                <div className="bg-blue-50 p-5 rounded-xl border border-blue-200">
                  <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    What Happens Next?
                  </h4>
                  <ol className="space-y-2 text-sm text-blue-700 list-decimal list-inside">
                    <li>Submit your form for review</li>
                    <li>Admin team verifies all information</li>
                    <li>You may be asked for additional documents</li>
                    <li>Once approved, your campaign goes live</li>
                    <li>Start receiving donations!</li>
                  </ol>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
