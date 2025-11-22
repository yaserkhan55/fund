import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import DonationModal from "../components/DonationModal";

const FALLBACK = "https://via.placeholder.com/600x400?text=No+Image";

export default function CampaignDetails() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDonation, setShowDonation] = useState(false);

  useEffect(() => {
    async function fetchCampaign() {
      setLoading(true);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/campaigns/${id}`
        );

        setCampaign(res.data?.data || null);
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
    <div className="container mx-auto p-6">
      <img
        src={campaign.image}
        alt={campaign.title}
        className="w-full h-72 object-cover rounded"
        onError={(e) => (e.target.src = FALLBACK)}
      />

      <h1 className="text-3xl font-bold mt-4">{campaign.title}</h1>

      <p className="text-gray-700 mt-4">{campaign.fullStory}</p>

      {/* DONATE BUTTON */}
      <button
        className="bg-[#00695c] text-white px-5 py-3 rounded-xl mt-6 w-full font-semibold shadow-md hover:bg-[#005248] transition-all duration-300 active:scale-95"
        onClick={() => setShowDonation(true)}
      >
        ❤️ Donate Now
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
