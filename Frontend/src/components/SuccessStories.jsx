import React from "react";

const testimonials = [
  {
    name: "Amina Siddiqui",
    city: "Hyderabad",
    quote:
      "SEUMP made it effortless to support causes close to my heart. The transparency at every step reminds me why I trust this platform.",
  },
  {
    name: "Farhan Qureshi",
    city: "Lucknow",
    quote:
      "Being able to read campaign updates in real time helped me feel involved. SEUMP's team truly cares about every contributor.",
  },
  {
    name: "Safiya Rahman",
    city: "Bengaluru",
    quote:
      "From zakat eligibility to campaign verification, SEUMP gives my family complete confidence when donating online.",
  },
  {
    name: "Hamza Ali",
    city: "Kozhikode",
    quote:
      "SEUMP guided me through starting my father's medical fundraiser. Their support team was compassionate and fast.",
  },
  {
    name: "Zara Khan",
    city: "Mumbai",
    quote:
      "The Start Helping flow is so simple. In a few taps I could boost a verified appeal and track the impact live.",
  },
  {
    name: "Imran Yusuf",
    city: "Chennai",
    quote:
      "SEUMP's credibility metrics convinced our masjid group to rally funds here. We now recommend it in every khutbah.",
  },
  {
    name: "Leena Parveen",
    city: "New Delhi",
    quote:
      "As a first-time campaigner I was nervous, but SEUMP's reviewer walked me through everything until approval.",
  },
  {
    name: "Yasir Altaf",
    city: "Srinagar",
    quote:
      "Knowing each rupee reaches the right hands matters to me. SEUMP's verification and updates keep donors assured.",
  },
  {
    name: "Noor Jehan",
    city: "Jaipur",
    quote:
      "We completed madrasa repairs faster than expected thanks to SEUMP supporters. The community on the platform is beautiful.",
  },
];

export default function SuccessStories() {
  return (
    <div className="w-[90%] mx-auto mt-14 mb-14">
      <h2 className="text-[#003d3b] text-3xl font-bold mb-6">
        Success Stories
        <span className="text-gray-500 font-normal"> (کامیابی کی کہانیاں)</span>
      </h2>

      <div
        className="
          flex gap-6 overflow-x-auto 
          snap-x snap-mandatory 
          scrollbar-hide pb-4
        "
      >
        {testimonials.map((story) => (
          <article
            key={story.name}
            className="
              snap-start 
              min-w-[85%] sm:min-w-[55%] md:min-w-[40%] lg:min-w-[28%]
              bg-white shadow-md rounded-2xl overflow-hidden 
              hover:shadow-lg transition flex flex-col h-[400px]
            "
          >
            <div className="p-5 flex flex-col flex-grow">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-16 w-16 rounded-full bg-[#E6F7F7] flex items-center justify-center text-[#00B5B8] font-semibold text-xl flex-shrink-0">
                  {story.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div>
                  <p className="text-lg font-semibold text-[#003D3B]">{story.name}</p>
                  <p className="text-sm text-[#005A58]">{story.city}</p>
                </div>
              </div>

              <p className="text-[#003D3B]/90 leading-relaxed text-base mb-4 flex-grow">
                "{story.quote}"
              </p>

              <div className="mt-auto">
                <div className="block text-center bg-[#003d3b] hover:bg-[#022e2c] text-white py-2.5 rounded-xl font-semibold transition">
                  Read More • مزید پڑھیں
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}