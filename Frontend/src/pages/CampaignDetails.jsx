import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../lib/api"; // use your API wrapper
import DonationModal from "../components/DonationModal";

const FALLBACK = "/no-image.png";

export default function CampaignDetails() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDonation, setShowDonation] = useState(false);

  useEffect(() => {
    async function fetchCampaign() {
      setLoading(true);
      try {
        // FIXED — no double /api
        const res = await api.get(`/campaigns/${id}`);

        setCampaign(res.data?.campaign || null);
      } catch (error) {
        console.error("Campaign fetch error:", error);
        setCampaign(null);
      }
      setLoading(false);
    }

    fetchCampaign();
  }, [id]);

  if (loading) {
    return <div className="text-center pt-20">Loading campaign...</div>;
  }

  if (!campaign) {
    return (
      <div className="text-center pt-20 text-red-600 font-semibold">
        Campaign not found.
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 mb-20">
      {/* Image */}
      <img
        src={campaign.imageUrl || campaign.image || FALLBACK}
        alt={campaign.title}
        className="w-full h-72 object-cover rounded-2xl shadow-md"
        onError={(e) => (e.target.src = FALLBACK)}
      />

      {/* Title */}
      <h1 className="text-3xl font-bold mt-6 text-[#003d3b]">
        {campaign.title}
      </h1>

      {/* Short Details */}
      <div className="mt-4 text-gray-700 leading-relaxed">
        {campaign.fullStory || "No full story available."}
      </div>

      {/* Donate Button — MATCHES SITE THEME */}
      <button
        className="
          mt-8 w-full py-3 rounded-xl font-semibold 
          bg-[#003d3b] text-white 
          shadow-lg hover:bg-[#022e2c] 
          transition-all duration-300 active:scale-95
        "
        onClick={() => setShowDonation(true)}
      >
        ❤️ Donate Now • ابھی عطیہ کریں
      </button>

      {showDonation && (
        <DonationModal
          campaignId={campaign._id}
          onClose={() => setShowDonation(false)}
        />
      )}
    </div>
  );
}
