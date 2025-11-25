import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import DonationModal from "../components/DonationModal";

const FALLBACK = "/no-image.png";
const TABS = [
  { id: "about", label: "About" },
  { id: "documents", label: "Documents" },
  { id: "updates", label: "Updates" },
  { id: "comments", label: "Comments" },
];

export default function CampaignDetails() {
  const { id } = useParams();
  const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

  const [campaign, setCampaign] = useState(null);
  const [patientImages, setPatientImages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({ supporters: 0, daysLeft: 0 });
  const [recentDonors, setRecentDonors] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDonation, setShowDonation] = useState(false);
  const [activeTab, setActiveTab] = useState("about");
  const [heroMedia, setHeroMedia] = useState(FALLBACK);
  const [copied, setCopied] = useState(false);

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

  const formatRelativeTime = (dateString) => {
    if (!dateString) return "";
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

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
        const [detailsRes, suggestedRes, donorsRes] = await Promise.all([
          axios.get(`${API_URL}/api/campaigns/details/${id}`),
          axios.get(`${API_URL}/api/campaigns/details/${id}/suggested`),
          axios.get(`${API_URL}/api/campaigns/details/${id}/donors`),
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
        setRecentDonors(donorsRes.data?.donors || []);
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

  const tabsContent = {
    about: (
      <div className="space-y-6">
        <div className="prose max-w-none text-[#003d3b]">
          <p className="font-semibold text-lg text-[#003d3b] mb-2">
            About the Fundraiser
          </p>
          <p className="leading-relaxed whitespace-pre-line text-gray-700">
            {aboutContent}
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
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
    updates: (
      <div className="text-gray-500">
        No updates yet. Campaigners can share treatment progress for supporters.
      </div>
    ),
    comments: (
      <div className="text-gray-500">
        Comments are disabled for now. Reach out via the share buttons to
        support this fundraiser.
      </div>
    ),
  };

  const galleryItems = patientImages.length
    ? patientImages
    : [campaign.imageUrl || campaign.image].filter(Boolean);

  return (
    <div className="bg-[#F1FAFA] min-h-screen pb-16">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        <div className="grid lg:grid-cols-[3fr,2fr] gap-8">
          <div className="bg-white rounded-3xl shadow-lg p-4">
            <div className="relative rounded-3xl overflow-hidden bg-gray-100">
              <img
                src={heroMedia}
                alt={campaign.title}
                className="w-full h-[360px] object-cover"
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
            <p className="text-gray-600 mt-2">{campaign.shortDescription}</p>

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
              ❤️ Contribute Now
            </button>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => handleShare("whatsapp")}
                className="py-3 rounded-2xl border border-[#00B5B8] text-[#00B5B8] font-semibold hover:bg-[#E0F7F8] transition flex items-center justify-center gap-2"
              >
                <span role="img" aria-label="whatsapp">
                  📱
                </span>
                Share
              </button>
              <button
                onClick={() => handleShare("facebook")}
                className="py-3 rounded-2xl border border-[#3B5998] text-[#3B5998] font-semibold hover:bg-[#EDF1FB] transition flex items-center justify-center gap-2"
              >
                <span role="img" aria-label="facebook">
                  📣
                </span>
                Share
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

        <div className="bg-white rounded-3xl shadow-lg">
          <div className="flex border-b border-[#E0F2F2] overflow-x-auto">
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
          <div className="p-6">{tabsContent[activeTab]}</div>
        </div>

        <section className="bg-white rounded-3xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-semibold text-[#003d3b]">
              Recent Contributions
            </h3>
            <p className="text-sm text-gray-500">
              Every social media share can bring ₹5000
            </p>
          </div>
          {recentDonors.length ? (
            <div className="grid md:grid-cols-2 gap-4">
              {recentDonors.map((donor) => (
                <div
                  key={donor._id}
                  className="border border-[#E0F2F2] rounded-2xl p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-[#003d3b]">{donor.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatRelativeTime(donor.createdAt)}
                    </p>
                  </div>
                  <div className="text-[#00B5B8] font-bold">
                    {formatCurrency(donor.amount)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Be the first to contribute.</p>
          )}
        </section>

        {suggested.length > 0 && (
          <section className="bg-white rounded-3xl shadow-lg p-6">
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
