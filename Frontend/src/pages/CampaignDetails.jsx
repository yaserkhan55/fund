import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";   // ← Already added
import DonationModal from "../components/DonationModal";

const FALLBACK = "/no-image.png";

export default function CampaignDetails() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDonation, setShowDonation] = useState(false);

  // New states for extra dynamic content
  const [patientImages, setPatientImages] = useState([]);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    async function fetchCampaign() {
      setLoading(true);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/campaigns/${id}`
        );

        const campaignData = res.data?.campaign || res.data?.data || null;
        setCampaign(campaignData);

        // New dynamic fields (won't break if empty)
        setPatientImages(res.data?.patientImages || campaignData?.patientImages || []);
        setDocuments(res.data?.documents || campaignData?.documents || []);
        
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
      
      {/* Main Campaign Image */}
      <img
        src={campaign.imageUrl || campaign.image || FALLBACK}
        alt={campaign.title}
        className="w-full h-72 object-cover rounded-2xl shadow-md"
        onError={(e) => (e.target.src = FALLBACK)}
      />

      {/* Patient Image Carousel */}
      {patientImages.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3 text-[#003d3b]">
            Patient Images
          </h2>

          <div className="flex gap-4 overflow-x-auto pb-3">
            {patientImages.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`patient-${i}`}
                className="h-40 w-56 object-cover rounded-xl shadow-md flex-shrink-0"
                onError={(e) => (e.target.src = FALLBACK)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Title */}
      <h1 className="text-3xl font-bold mt-6 text-[#003d3b]">
        {campaign.title}
      </h1>

      {/* Story / Full Description */}
      <div className="mt-4 text-gray-700 leading-relaxed">
        {campaign.fullStory || "No full story available."}
      </div>

      {/* ABOUT SECTION */}
      <div className="mt-10 p-5 rounded-xl bg-gray-50 shadow-md">
        <h2 className="text-2xl font-semibold mb-3 text-[#003d3b]">About</h2>
        <p className="text-gray-700 leading-relaxed">
          {campaign.about ||
            campaign.fullStory ||
            "No additional details available."}
        </p>
      </div>

      {/* DOCUMENTS SECTION */}
      {documents.length > 0 && (
        <div className="mt-10 p-5 rounded-xl bg-gray-50 shadow-md">
          <h2 className="text-2xl font-semibold mb-3 text-[#003d3b]">
            Medical Documents
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {documents.map((doc, i) => (
              <a
                href={doc}
                key={i}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <img
                  src={doc}
                  className="h-40 w-full object-cover rounded-xl shadow-md border hover:scale-105 transition"
                  onError={(e) => (e.target.src = FALLBACK)}
                  alt={`document-${i}`}
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Donate Button */}
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
