import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
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
      <div className="min-h-screen flex items-center justify-center text-[#003d3b] font-semibold">
        Loading campaign...
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
          <div className="p-4 rounded-2xl border border-[#E0F2F2] bg-[#F8FEFE]">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
              Beneficiary
            </p>
            <p className="text-lg font-semibold text-[#003d3b]">
              {campaign.beneficiaryName}
            </p>
            <p className="text-sm text-gray-500">{campaign.relation}</p>
          </div>
          <div className="p-4 rounded-2xl border border-[#E0F2F2] bg-[#F8FEFE]">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
              Location
            </p>
            <p className="text-lg font-semibold text-[#003d3b]">
              {campaign.city}
            </p>
            <p className="text-sm text-gray-500">{campaign.category}</p>
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

  return (
    <div className="bg-[#F1FAFA] min-h-screen pb-8">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="grid lg:grid-cols-[3fr,2fr] gap-8">
          <div className="bg-white rounded-3xl shadow-lg p-4">
            <div className="relative rounded-3xl overflow-hidden bg-gray-100">
              <img
                src={heroMedia}
                alt={campaign.title}
                className="w-full h-[300px] object-cover"
                onError={(e) => (e.currentTarget.src = FALLBACK)}
              />
              <button
                className="absolute bottom-4 right-4 px-4 py-2 bg-white rounded-full shadow text-sm font-semibold text-[#003d3b]"
                onClick={() => setActiveTab("documents")}
              >
                View documents
              </button>
            </div>
            {galleryItems.length > 1 && (
              <div className="mt-4">
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

          <aside className="bg-white rounded-3xl shadow-lg p-6 lg:sticky lg:top-24 self-start">
            <div className="flex items-center gap-3 mb-4 text-xs uppercase tracking-[0.3em] text-[#00B5B8]">
              <span>SEUMP VERIFIED</span>
            </div>
            <h1 className="text-3xl font-bold text-[#003d3b]">{campaign.title}</h1>

            <div className="mt-6">
              <div className="text-4xl font-bold text-[#003d3b]">
                {formatCurrency(raised)}
              </div>
              <p className="text-gray-500 text-sm">
                raised of {formatCurrency(goal)} goal
              </p>
              <div className="mt-4 h-3 bg-[#E0F2F2] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00B5B8]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-center mt-4">
                <div>
                  <p className="text-2xl font-semibold text-[#003d3b]">
                    {supporters}
                  </p>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Supporters
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-[#003d3b]">
                    {daysLabel}
                  </p>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Days left
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-[#003d3b]">
                    {formatCurrency(amountLeft)}
                  </p>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Still needed
                  </p>
                </div>
              </div>
            </div>

            <button
              className="w-full mt-6 py-3 rounded-2xl bg-[#00B5B8] text-white font-semibold shadow-md hover:bg-[#009EA1] transition"
              onClick={() => setShowDonation(true)}
            >
              Contribute Now
            </button>

            <div className="mt-4">
              <button
                onClick={() => handleShare("whatsapp")}
                className="w-full py-3 rounded-2xl border border-[#00B5B8] text-[#00B5B8] font-semibold hover:bg-[#E0F7F8] transition flex items-center justify-center gap-2"
              >
                <FaWhatsapp className="text-xl" />
                Share on WhatsApp
              </button>
            </div>
            <button
              onClick={() => handleShare("copy")}
              className="w-full mt-3 py-3 rounded-2xl border border-dashed border-[#CFE7E7] text-[#003d3b] font-medium hover:bg-[#F8FEFE]"
            >
              {copied ? "Link copied!" : "Copy fundraiser link"}
            </button>

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

      {showDonation && (
        <DonationModal
          campaignId={campaign._id}
          onClose={() => setShowDonation(false)}
        />
      )}
    </div>
  );
}
