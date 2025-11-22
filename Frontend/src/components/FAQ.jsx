import React from "react";

const faqs = [
  {
    q: "How does fundraising work?",
    a: "You can create a campaign, share it, and people can donate instantly.",
  },
  {
    q: "Is this platform Islamic-compliant?",
    a: "Yes. We avoid interest-based systems and ensure campaigns follow ethical guidelines.",
  },
  {
    q: "How are donations processed?",
    a: "Secure payment gateways ensure safe transfers.",
  },
];

function FAQ() {
  return (
    <section className="w-[90%] mx-auto my-16">
      <h2 className="text-3xl font-semibold text-[#003D3B]">
        Frequently Asked Questions
      </h2>

      <div className="mt-6">
        {faqs.map((f) => (
          <div
            key={f.q}
            className="
              bg-[#E6F7F7]
              p-6
              rounded-xl
              mb-4
              shadow-sm
              border border-transparent
              hover:border-[#00B5B8]
              hover:bg-[#D9F0F0]
              transition-all duration-300
            "
          >
            <h3 className="text-xl font-semibold text-[#003D3B]">{f.q}</h3>
            <p className="mt-2 text-[#003D3B]/80">{f.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default FAQ;
