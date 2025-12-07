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
  const [itemsPerView, setItemsPerView] = useState(1);

  // Calculate items per view based on screen size
  useEffect(() => {
    const updateItemsPerView = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setItemsPerView(3); // Desktop: 3 items
      } else if (width >= 768) {
        setItemsPerView(2); // Tablet: 2 items
      } else {
        setItemsPerView(1); // Mobile: 1 item
      }
    };

    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  // Auto-rotate carousel - move one by one through all testimonials
  useEffect(() => {
    if (!testimonials.length) return;
    
    // Calculate max index - only show complete slides (no partial slides)
    const totalSlides = Math.floor(testimonials.length / itemsPerView);
    const maxIndex = Math.max(0, totalSlides - 1);
    
    // Reset activeIndex if it's beyond maxIndex
    setActiveIndex((prev) => {
      if (prev > maxIndex) {
        return 0;
      }
      return prev;
    });
    
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        if (prev >= maxIndex) {
          return 0; // Loop back to start
        }
        return prev + 1;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [testimonials.length, itemsPerView]);

  return (
    <section className="w-[90%] mx-auto mt-32 mb-20 relative">
      {/* Decorative separator with light effect */}
      <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 w-full max-w-2xl">
        <div className="h-px bg-gradient-to-r from-transparent via-[#CFE7E7] to-transparent"></div>
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-[#00B5B8] to-transparent opacity-40 blur-sm"></div>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <p className="uppercase text-xs tracking-[0.4em] text-[#00B5B8] font-semibold">
            Voices of Trust
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold text-[#003D3B]">
            What our users say about SEUMP
          </h2>
        </div>
      </div>

      <div className="overflow-hidden relative w-full">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ 
            transform: `translateX(-${activeIndex * 100}%)`
          }}
        >
          {/* Group testimonials into slides - only show complete slides */}
          {Array.from({ length: Math.floor(testimonials.length / itemsPerView) }).map((_, slideIdx) => (
            <div
              key={slideIdx}
              className="flex-shrink-0 w-full"
            >
              <div className="flex gap-3 sm:gap-4 w-full">
                {testimonials
                  .slice(slideIdx * itemsPerView, slideIdx * itemsPerView + itemsPerView)
                  .map((story) => (
                    <article
                      key={story.name}
                      className="flex-shrink-0 flex-grow-0"
                      style={{ 
                        width: `${100 / itemsPerView}%`,
                        flexBasis: `${100 / itemsPerView}%`
                      }}
                    >
                      <div className="bg-white border border-[#CFE7E7] rounded-2xl p-6 md:p-8 shadow-md h-full hover:shadow-xl hover:border-[#00B5B8]/40 transition-all duration-300 relative group">
                        {/* Subtle light effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#00B5B8]/0 via-[#00B5B8]/0 to-[#00B5B8]/8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"></div>
                        
                        {/* Quote icon */}
                        <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                          <svg className="w-12 h-12 text-[#00B5B8]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                          </svg>
                        </div>
                        
                        <div className="flex items-center gap-4 mb-5 relative z-10">
                          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#E6F7F7] to-[#00B5B8]/20 flex items-center justify-center text-[#00B5B8] font-semibold text-xl flex-shrink-0 ring-2 ring-[#00B5B8]/20 group-hover:ring-[#00B5B8]/40 transition-all duration-300">
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
                            <p className="text-lg font-bold text-[#003D3B] group-hover:text-[#00B5B8] transition-colors duration-300">{story.name}</p>
                            <p className="text-sm text-[#005A58] font-medium">{story.city}</p>
                          </div>
                        </div>
                        <p className="text-[#003D3B]/90 leading-relaxed text-base md:text-lg relative z-10 italic">
                          "{story.quote}"
                        </p>
                      </div>
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