import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { FaWhatsapp } from "react-icons/fa";
import DonationModal from "../components/DonationModal";

const FALLBACK = "/no-image.png";
const TABS = [
  { id: "about", label: "About" },
  { id: "documents", label: "Documents" },
];

export default function CampaignDetails() {
  const { id } = useParams();
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

  const [campaign, setCampaign] = useState(null);
  const [patientImages, setPatientImages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({ supporters: 0, daysLeft: 0 });
  const [suggested, setSuggested] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDonation, setShowDonation] = useState(false);
  const [activeTab, setActiveTab] = useState("about");
  const [heroMedia, setHeroMedia] = useState(FALLBACK);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const galleryStripRef = useRef(null);
  const documentStripRef = useRef(null);

  const resolveAsset = (path) => {
    if (!path) return FALLBACK;
    if (path.startsWith("http")) return path;
    const base = API_URL?.replace(/\/$/, "");
    return `${base}/${path.replace(/^\/+/, "")}`;
  };

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`;


  const scrollStrip = (ref, direction) => {
    if (!ref.current) return;
    const amount = ref.current.clientWidth || 320;
    ref.current.scrollBy({
      left: direction === "next" ? amount : -amount,
      behavior: "smooth",
    });
  };

  const handleShare = async (platform) => {
    if (!campaign || typeof window === "undefined") return;
    const url = window.location.href;
    const text = `I am supporting "${campaign.title}" on SEUMP. Join me: ${url}`;
    if (platform === "whatsapp") {
      window.open(
        `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`,
        "_blank"
      );
      return;
    }
    if (platform === "facebook") {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        "_blank"
      );
      return;
    }
    if (platform === "copy" && navigator?.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchCampaignDetails() {
      setLoading(true);
      try {
        const [detailsRes, suggestedRes] = await Promise.all([
          axios.get(`${API_URL}/api/campaigns/details/${id}`),
          axios.get(`${API_URL}/api/campaigns/details/${id}/suggested`),
        ]);

        if (!isMounted) return;

        const details = detailsRes.data || {};
        const campaignData = details.campaign || null;
        setCampaign(campaignData);
        setPatientImages(details.patientImages || []);
        setDocuments(details.documents || []);
        setStats(details.stats || { supporters: 0, daysLeft: 0 });

        const cover =
          campaignData?.imageUrl ||
          campaignData?.image ||
          details.patientImages?.[0];
        setHeroMedia(resolveAsset(cover || FALLBACK));

        setSuggested(suggestedRes.data?.campaigns || []);
      } catch (error) {
        console.error("Details fetch error:", error);
        if (isMounted) {
          setCampaign(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchCampaignDetails();
    return () => {
      isMounted = false;
    };
  }, [API_URL, id]);

  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center bg-white">
        <img
          src="/WhatsApp Image 2025-11-20 at 12.07.54 PM.jpeg"
          alt="Loading..."
          className="w-28 h-28 object-contain opacity-90 animate-pulse"
        />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 font-semibold">
        Campaign not found.
      </div>
    );
  }

  const raised = Number(campaign.raisedAmount || 0);
  const goal = Math.max(1, Number(campaign.goalAmount || 0));
  const progress = Math.min(100, Math.round((raised / goal) * 100));
  const supporters = stats.supporters ?? 0;
  const daysLeft = stats.daysLeft ?? 0;
  const daysLabel = daysLeft > 0 ? daysLeft : "∞";
  const amountLeft = Math.max(goal - raised, 0);

  const aboutContent =
    campaign.about && campaign.about.length > 0
      ? campaign.about
      : campaign.fullStory || "No story available.";

  // Split content for Read More functionality
  const words = aboutContent.split(" ");
  const previewLength = 50; // Show first 50 words
  const shouldShowReadMore = words.length > previewLength;
  const previewText = shouldShowReadMore
    ? words.slice(0, previewLength).join(" ") + "..."
    : aboutContent;
  const fullText = aboutContent;

  const tabsContent = {
    about: (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-[#003d3b] mb-4">About the Fundraiser</h2>
        <div className="prose max-w-none text-[#003d3b]">
          <p className="leading-relaxed whitespace-pre-line text-gray-700">
            {isExpanded ? fullText : previewText}
          </p>
          {shouldShowReadMore && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-6 px-6 py-3 rounded-full bg-white border-2 border-[#00B5B8] text-[#00B5B8] font-semibold hover:bg-[#E0F7F8] transition-colors"
            >
              {isExpanded ? "Read Less" : "Read More"}
            </button>
          )}
        </div>
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <div className="p-6 rounded-2xl border-2 border-[#E0F2F2] bg-gradient-to-br from-[#F8FEFE] to-white hover:border-[#00B5B8]/40 transition-all duration-300 group">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2 font-semibold">
              Beneficiary
            </p>
            <p className="text-xl font-bold text-[#003d3b] group-hover:text-[#00B5B8] transition-colors duration-300">
              {campaign.beneficiaryName}
            </p>
            <p className="text-sm text-gray-600 mt-1 font-medium">{campaign.relation}</p>
          </div>
          <div className="p-6 rounded-2xl border-2 border-[#E0F2F2] bg-gradient-to-br from-[#F8FEFE] to-white hover:border-[#00B5B8]/40 transition-all duration-300 group">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2 font-semibold">
              Location
            </p>
            <p className="text-xl font-bold text-[#003d3b] group-hover:text-[#00B5B8] transition-colors duration-300">
              {campaign.city}
            </p>
            <p className="text-sm text-gray-600 mt-1 font-medium capitalize">{campaign.category}</p>
          </div>
        </div>
      </div>
    ),
    documents: documents.length ? (
      <div className="space-y-4">
        <p className="text-gray-600">
          Medical bills, discharge summaries and prescriptions submitted by the
          campaigner.
        </p>
        <div className="relative">
          <button
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white shadow rounded-full h-10 w-10 flex items-center justify-center border border-[#E0F2F2]"
            onClick={() => scrollStrip(documentStripRef, "prev")}
            aria-label="Scroll documents left"
          >
            ‹
          </button>
          <div
            ref={documentStripRef}
            className="flex gap-4 overflow-x-auto px-12 pb-2 scroll-smooth"
          >
            {documents.map((doc, idx) => (
              <a
                key={idx}
                href={resolveAsset(doc)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
              >
                <img
                  src={resolveAsset(doc)}
                  alt={`document-${idx}`}
                  className="h-48 w-36 object-cover rounded-2xl border border-[#E0F2F2] shadow"
                  onError={(e) => (e.currentTarget.src = FALLBACK)}
                />
              </a>
            ))}
          </div>
          <button
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white shadow rounded-full h-10 w-10 flex items-center justify-center border border-[#E0F2F2]"
            onClick={() => scrollStrip(documentStripRef, "next")}
            aria-label="Scroll documents right"
          >
            ›
          </button>
        </div>
      </div>
    ) : (
      <p className="text-gray-500">Medical documents will appear here once uploaded.</p>
    ),
  };

  const galleryItems = patientImages.length
    ? patientImages
    : [campaign.imageUrl || campaign.image].filter(Boolean);

  // Removed debug useEffects that might cause issues

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1FAFA] flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-[#00B5B8] mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-[#F1FAFA] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Campaign not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#F1FAFA] via-white to-[#E6F7F7] min-h-screen pb-12">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeInUp">
        <div className="grid lg:grid-cols-[3fr,2fr] gap-8">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            <div className="relative w-full overflow-hidden" style={{ height: '500px' }}>
              <img
                src={heroMedia}
                alt={campaign.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                style={{ objectFit: 'cover', objectPosition: 'center' }}
                onError={(e) => (e.currentTarget.src = FALLBACK)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
              <button
                className="absolute bottom-6 right-6 px-6 py-3 bg-white/95 backdrop-blur-sm rounded-full shadow-xl text-sm font-bold text-[#003d3b] hover:bg-white transition-all duration-300 transform hover:scale-105 flex items-center gap-2 group"
                onClick={() => setActiveTab("documents")}
              >
                <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Documents
              </button>
            </div>
            {galleryItems.length > 1 && (
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-2">Medical journey</p>
                <div className="relative">
                  <button
                    className="absolute left-0 top-1/2 -translate-y-1/2 bg-white shadow rounded-full h-8 w-8 flex items-center justify-center border border-[#E0F2F2]"
                    onClick={() => scrollStrip(galleryStripRef, "prev")}
                    aria-label="Scroll patient images left"
                  >
                    ‹
                  </button>
                  <div
                    ref={galleryStripRef}
                    className="flex gap-3 overflow-x-auto px-10 pb-2 scroll-smooth"
                  >
                    {galleryItems.map((img, idx) => {
                      const src = resolveAsset(img);
                      return (
                        <button
                          key={idx}
                          className={`h-24 w-32 rounded-2xl overflow-hidden border ${
                            heroMedia === src
                              ? "border-[#00B5B8]"
                              : "border-transparent"
                          }`}
                          onClick={() => setHeroMedia(src)}
                        >
                          <img
                            src={src}
                            alt={`patient-${idx}`}
                            className="h-full w-full object-cover"
                            onError={(e) => (e.currentTarget.src = FALLBACK)}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <button
                    className="absolute right-0 top-1/2 -translate-y-1/2 bg-white shadow rounded-full h-8 w-8 flex items-center justify-center border border-[#E0F2F2]"
                    onClick={() => scrollStrip(galleryStripRef, "next")}
                    aria-label="Scroll patient images right"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </div>

          <aside className="bg-white rounded-3xl shadow-xl p-8 lg:sticky lg:top-24 self-start border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00B5B8]/10 to-[#009EA1]/10 rounded-full border border-[#00B5B8]/20">
                <svg className="w-5 h-5 text-[#00B5B8]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs uppercase tracking-[0.2em] text-[#00B5B8] font-bold">SEUMP VERIFIED</span>
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#003d3b] mb-6 leading-tight">{campaign.title}</h1>

            <div className="mt-8">
              <div className="flex items-baseline gap-2 mb-2">
                <div className="text-5xl font-bold bg-gradient-to-r from-[#00B5B8] to-[#009EA1] bg-clip-text text-transparent">
                  {formatCurrency(raised)}
                </div>
              </div>
              <p className="text-gray-600 text-base mb-6 font-medium">
                raised of <span className="text-[#003d3b] font-semibold">{formatCurrency(goal)}</span> goal
              </p>
              <div className="mb-2">
                <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-[#00B5B8] to-[#009EA1] relative overflow-hidden"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 font-medium">{progress}% funded</p>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
                <div className="text-center group">
                  <p className="text-3xl font-bold text-[#003d3b] group-hover:text-[#00B5B8] transition-colors duration-300">
                    {supporters}
                  </p>
                  <p className="text-xs text-gray-600 uppercase tracking-wide mt-1 font-semibold">
                    Supporters
                  </p>
                </div>
                <div className="text-center group">
                  <p className="text-3xl font-bold text-[#003d3b] group-hover:text-[#00B5B8] transition-colors duration-300">
                    {daysLabel}
                  </p>
                  <p className="text-xs text-gray-600 uppercase tracking-wide mt-1 font-semibold">
                    Days left
                  </p>
                </div>
                <div className="text-center group">
                  <p className="text-2xl font-bold text-[#003d3b] group-hover:text-[#00B5B8] transition-colors duration-300">
                    {formatCurrency(amountLeft)}
                  </p>
                  <p className="text-xs text-gray-600 uppercase tracking-wide mt-1 font-semibold">
                    Still needed
                  </p>
                </div>
              </div>
            </div>

            {/* Donate Button - Always show for now, can restrict later */}
            {campaign ? (
              <button
                className="group relative w-full mt-6 py-4 rounded-2xl bg-gradient-to-r from-[#00B5B8] to-[#009EA1] text-white font-bold text-lg shadow-lg hover:from-[#009EA1] hover:to-[#008B8E] transition-all transform hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("Donate button clicked");
                  if (!isSignedIn) {
                    // Store message in localStorage to show on sign-up page
                    localStorage.setItem("donationAuthMessage", "For donation, first you have to create account");
                    navigate("/sign-up");
                  } else {
                    setShowDonation(true);
                  }
                }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Donate Now
                </span>
              </button>
            ) : (
              <div className="w-full mt-6 py-4 rounded-2xl bg-gray-200 text-gray-500 font-semibold text-center">
                Campaign Pending Approval
              </div>
            )}

            <div className="mt-6 space-y-3">
              <button
                onClick={() => handleShare("whatsapp")}
                className="w-full py-3.5 rounded-xl border-2 border-[#00B5B8] text-[#00B5B8] font-semibold hover:bg-gradient-to-r hover:from-[#00B5B8] hover:to-[#009EA1] hover:text-white transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2 group"
              >
                <FaWhatsapp className="text-xl group-hover:scale-110 transition-transform duration-300" />
                Share on WhatsApp
              </button>
              <button
                onClick={() => handleShare("copy")}
                className="w-full py-3 rounded-xl border-2 border-dashed border-[#CFE7E7] text-[#003d3b] font-medium hover:border-[#00B5B8] hover:bg-[#F8FEFE] transition-all duration-300 flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Link copied!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy fundraiser link
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-[#F8FEFE] border border-[#E0F2F2]">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
                Campaigner
              </p>
              <p className="text-lg font-semibold text-[#003d3b]">
                {campaign.beneficiaryName}
              </p>
              <p className="text-sm text-gray-500">
                {campaign.relation} • {campaign.city}
              </p>
            </div>
          </aside>
        </div>

        {/* Navigation Tabs and Content Section */}
        <div className="bg-white rounded-3xl shadow-lg">
          <div className="flex items-center justify-between border-b border-[#E0F2F2] overflow-x-auto">
            <div className="flex">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] ${
                    activeTab === tab.id
                      ? "text-[#00B5B8] border-b-4 border-[#00B5B8]"
                      : "text-gray-400"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => handleShare("whatsapp")}
              className="mr-6 px-6 py-2 rounded-full bg-[#00B5B8] text-white font-semibold hover:bg-[#009EA1] transition flex items-center gap-2"
            >
              <FaWhatsapp className="text-lg" />
              Share
            </button>
          </div>
          <div className="p-6">{tabsContent[activeTab]}</div>
        </div>

        {suggested.length > 0 && (
          <section className="bg-white rounded-3xl shadow-lg p-6 mb-0">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-[#003d3b]">
                People also viewed
              </h3>
              <p className="text-sm text-gray-500">
                Support another verified campaign
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {suggested.map((item) => {
                const completion = Math.min(
                  100,
                  ((item.raisedAmount || 0) /
                    Math.max(Number(item.goalAmount) || 0, 1)) *
                    100
                );
                return (
                  <Link
                    key={item._id}
                    to={`/campaign/${item._id}`}
                    className="border border-[#E0F2F2] rounded-2xl p-4 flex gap-4 hover:shadow-md transition"
                  >
                    <img
                      src={resolveAsset(item.image || item.imageUrl || FALLBACK)}
                      alt={item.title}
                      className="h-24 w-24 rounded-2xl object-cover flex-shrink-0"
                      onError={(e) => (e.currentTarget.src = FALLBACK)}
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-[#003d3b] line-clamp-2">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500 uppercase mt-1">
                        {item.category}
                      </p>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs font-semibold text-gray-500">
                          <span>{formatCurrency(item.raisedAmount || 0)}</span>
                          <span>{formatCurrency(item.goalAmount || 0)}</span>
                        </div>
                        <div className="mt-1 h-2 bg-[#E0F2F2] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#00B5B8]"
                            style={{ width: `${completion}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {showDonation && campaign && (
        <DonationModal
          campaignId={campaign._id}
          onClose={() => {
            console.log("Closing donation modal");
            setShowDonation(false);
          }}
        />
      )}
    </div>
  );
}
