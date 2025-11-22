import React from "react";

export default function Hero() {
  return (
    <section className="w-full bg-[#E6F7F7] pt-28 pb-16 px-4 overflow-hidden">
      {/* Wrapper */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-14">

        {/* LEFT SIDE */}
        <div className="flex-1">
          <h1 className="text-4xl md:text-5xl font-bold text-[#003D3B] leading-tight">
            Become a <br /> Changemaker!
          </h1>

          <p className="text-gray-700 text-lg mt-4">
            Start your journey with your first contribution.
          </p>

          <button
            className="mt-6 bg-[#00B5B8] hover:bg-[#009a9c] text-white font-semibold px-7 py-3 rounded-lg shadow-md transition"
          >
            Start Helping →
          </button>

          {/* STATS */}
          <div className="flex flex-wrap gap-10 mt-12">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-[#003D3B]">12.9K</h2>
              <p className="text-gray-600">Lives Saved</p>
            </div>

            <div className="text-center">
              <h2 className="text-3xl font-bold text-[#003D3B]">1.2M</h2>
              <p className="text-gray-600">Contributors</p>
            </div>

            <div className="text-center">
              <h2 className="text-3xl font-bold text-[#003D3B]">15.9K</h2>
              <p className="text-gray-600">Trusted Campaigns</p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE IMAGE */}
        <div className="flex-1 flex justify-center">
          <img
            src="https://cdn-icons-png.flaticon.com/512/3209/3209265.png"
            alt="Helping Hands"
            className="w-64 md:w-96 drop-shadow-md"
          />
        </div>
      </div>
    </section>
  );
}
