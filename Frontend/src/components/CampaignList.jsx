const CampaignList = ({ campaigns }) => {
  const FALLBACK = "https://via.placeholder.com/400x300?text=No+Image";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {campaigns && campaigns.length > 0 ? (
        campaigns.map((c) => (
          <div key={c._id} className="bg-white rounded shadow">
            <img
              src={c.image}
              alt={c.title}
              className="w-full h-48 object-cover"
              onError={(e) => (e.target.src = FALLBACK)}
            />
            <div className="p-4">
              <h2 className="font-bold">{c.title}</h2>
            </div>
          </div>
        ))
      ) : (
        <p>No campaigns found.</p>
      )}
    </div>
  );
};

export default CampaignList;

