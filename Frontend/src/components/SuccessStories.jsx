import { useEffect, useState } from "react";

const testimonials = [
  {
    name: "Amina Siddiqui",
    city: "Hyderabad",
    quote:
      "SEUMP made it effortless to support causes close to my heart. The transparency at every step reminds me why I trust this platform.",
    avatar: "/images/testimonials/amina.png",
  },
  {
    name: "Farhan Qureshi",
    city: "Lucknow",
    quote:
      "Being able to read campaign updates in real time helped me feel involved. SEUMP’s team truly cares about every contributor.",
    avatar: "/images/testimonials/farhan.png",
  },
  {
    name: "Safiya Rahman",
    city: "Bengaluru",
    quote:
      "From zakat eligibility to campaign verification, SEUMP gives my family complete confidence when donating online.",
    avatar: "/images/testimonials/safiya.png",
  },
  {
    name: "Hamza Ali",
    city: "Kozhikode",
    quote:
      "SEUMP guided me through starting my father’s medical fundraiser. Their support team was compassionate and fast.",
    avatar: "/images/testimonials/hamza.png",
  },
];

export default function SuccessStories() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="w-[90%] mx-auto my-16">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <p className="uppercase text-xs tracking-[0.4em] text-[#00B5B8] font-semibold">
            Voices of Trust
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold text-[#003D3B]">
            What our users say about SEUMP
          </h2>
        </div>
        <div className="flex gap-2">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              aria-label={`Go to testimonial ${idx + 1}`}
              className={`h-2.5 w-8 rounded-full transition-all ${
                idx === activeIndex ? "bg-[#00B5B8]" : "bg-[#CFE7E7]"
              }`}
              onClick={() => setActiveIndex(idx)}
            />
          ))}
        </div>
      </div>

      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {testimonials.map((story, idx) => (
            <article
              key={story.name}
              className="min-w-full md:min-w-[50%] lg:min-w-[33.3333%] px-4"
            >
              <div className="bg-white border border-[#CFE7E7] rounded-2xl p-6 shadow-sm h-full">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-16 w-16 rounded-full bg-[#E6F7F7] flex items-center justify-center text-[#00B5B8] font-semibold text-xl">
                    {story.avatar ? (
                      <img
                        src={story.avatar}
                        alt={story.name}
                        className="h-full w-full rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "https://ui-avatars.com/api/?background=00B5B8&color=fff&name=" + encodeURIComponent(story.name);
                        }}
                      />
                    ) : (
                      story.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-[#003D3B]">{story.name}</p>
                    <p className="text-sm text-[#005A58]">{story.city}</p>
                  </div>
                </div>
                <p className="text-[#003D3B]/90 leading-relaxed text-base">
                  “{story.quote}”
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}