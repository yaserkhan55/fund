import { useEffect, useMemo, useState } from "react";

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
      "Being able to read campaign updates in real time helped me feel involved. SEUMP’s team truly cares about every contributor.",
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
      "SEUMP guided me through starting my father’s medical fundraiser. Their support team was compassionate and fast.",
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
      "SEUMP’s credibility metrics convinced our masjid group to rally funds here. We now recommend it in every khutbah.",
  },
  {
    name: "Leena Parveen",
    city: "New Delhi",
    quote:
      "As a first-time campaigner I was nervous, but SEUMP’s reviewer walked me through everything until approval.",
  },
  {
    name: "Yasir Altaf",
    city: "Srinagar",
    quote:
      "Knowing each rupee reaches the right hands matters to me. SEUMP’s verification and updates keep donors assured.",
  },
  {
    name: "Noor Jehan",
    city: "Jaipur",
    quote:
      "We completed madrasa repairs faster than expected thanks to SEUMP supporters. The community on the platform is beautiful.",
  },
];

const CARDS_PER_SLIDE = 3;

export default function SuccessStories() {
  const slides = useMemo(() => {
    const groups = [];
    for (let i = 0; i < testimonials.length; i += CARDS_PER_SLIDE) {
      groups.push(testimonials.slice(i, i + CARDS_PER_SLIDE));
    }
    return groups;
  }, []);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!slides.length) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) return null;

  return (
    <section className="w-[90%] mx-auto my-16">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <p className="uppercase text-xs tracking-[0.4em] text-[#00B5B8] font-semibold">
            Voices of Trust
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold text-[#00B5B8]">
            What our users say about SEUMP
          </h2>
        </div>
        <div className="flex gap-2">
          {slides.map((_, idx) => (
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
          {slides.map((group, slideIdx) => (
            <div key={slideIdx} className="min-w-full px-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.map((story, cardIdx) => (
                  <article
                    key={`${story.name}-${cardIdx}`}
                    className="bg-white border border-[#CFE7E7] rounded-2xl p-6 shadow-sm h-full"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-16 w-16 rounded-full bg-[#E6F7F7] flex items-center justify-center text-[#00B5B8] font-semibold text-xl">
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
                    <p className="text-[#003D3B]/90 leading-relaxed text-base">
                      “{story.quote}”
                    </p>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}