import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import DonationModal from "../components/DonationModal";

const FALLBACK = "/no-image.png";

export default function CampaignDetails() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [patientImages, setPatientImages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDonation, setShowDonation] = useState(false);

  useEffect(() => {
    async function fetchCampaignDetails() {
      setLoading(true);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/campaigns/details/${id}`
        );

        const data = res.data || {};

        setCampaign(data.campaign || null);
        setPatientImages(data.patientImages || []);
        setDocuments(data.documents || []);

      } catch (error) {
        console.error("Details fetch error:", error);
        setCampaign(null);
      }
      setLoading(false);
    }

    fetchCampaignDetails();
  }, [id]);

  if (loading) return <div className="text-center pt-20">Loading campaign...</div>;

  if (!campaign) {
    return (
      <div className="text-center pt-20 text-red-600 font-semibold">
        Campaign not found.
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 mb-20">

      {/* Main Image */}
      <img
        src={campaign.imageUrl || campaign.image || FALLBACK}
        alt={campaign.title}
        className="w-full h-72 object-cover rounded-2xl shadow-md"
        onError={(e) => (e.target.src = FALLBACK)}
      />

      {/* Patient Gallery Carousel */}
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

      {/* Story */}
      <div className="mt-4 text-gray-700 leading-relaxed">
        {campaign.fullStory || "No story available."}
      </div>

      {/* ABOUT SECTION */}
      <div className="mt-10 p-5 rounded-xl bg-gray-50 shadow-md">
        <h2 className="text-2xl font-semibold mb-3 text-[#003d3b]">About</h2>
        <p className="text-gray-700 leading-relaxed">
          {campaign.about || "No additional information."}
        </p>
      </div>

      {/* MEDICAL DOCUMENTS */}
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
                  alt={`document-${i}`}
                  onError={(e) => (e.target.src = FALLBACK)}
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* DONATE BUTTON */}
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
