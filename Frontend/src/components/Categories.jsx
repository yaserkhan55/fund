import { useNavigate } from "react-router-dom";

const categories = [
  { name: "Medical", icon: "💉" },
  { name: "Education", icon: "📚" },
  { name: "Disaster Relief", icon: "🌊" },
  { name: "Mosque Construction", icon: "🕌" },
];

export default function Categories() {
  const navigate = useNavigate();

  return (
    <section className="w-[90%] mx-auto my-16">
      <h2 className="text-3xl font-semibold text-[#003D3B] mb-6">
        Categories
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((cat) => (
          <div
            key={cat.name}
            onClick={() => navigate(`/category/${cat.name.toLowerCase()}`)}
            className="
              bg-[#E6F7F7]
              rounded-xl
              p-8
              text-center
              shadow-sm
              cursor-pointer
              border border-transparent
              transition-all duration-300
              hover:shadow-md
              hover:border-[#00B5B8]
              hover:bg-[#D9F0F0]
            "
          >
            <div className="text-5xl mb-4">{cat.icon}</div>
            <h3 className="text-xl font-semibold text-[#003D3B]">
              {cat.name}
            </h3>
          </div>
        ))}
      </div>
    </section>
  );
}
