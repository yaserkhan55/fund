export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-[#E6F5F3] to-[#C9ECE7] text-[#003D3B] py-12 px-6 mt-10 border-t border-[#00AEEF]/20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">

        {/* LOGO + FOLLOWERS */}
        <div>
          <div className="flex items-center gap-2">
            <img
              src="/WhatsApp Image 2025-11-20 at 12.07.54 PM.jpeg"
              alt="Fund Logo"
              className="w-10 h-10 rounded-full object-cover shadow-md"
            />
            <h1 className="text-3xl font-bold">
              <span className="text-[#00AEEF]">SEUMP</span>
            </h1>
          </div>

          <div className="h-[1px] bg-[#003D3B]/20 my-4 w-32"></div>

          {/* Simple Social Icons */}
          <div className="flex space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#003D3B]/10"></div>
            <div className="w-8 h-8 rounded-full bg-[#003D3B]/10"></div>
            <div className="w-8 h-8 rounded-full bg-[#003D3B]/10"></div>
            <div className="w-8 h-8 rounded-full bg-[#003D3B]/10"></div>
            <div className="w-8 h-8 rounded-full bg-[#003D3B]/10"></div>
          </div>

          <p className="mt-4 font-semibold text-lg text-[#00AEEF]">2.5M +</p>
          <p className="text-sm opacity-80">Followers</p>

          {/* Contact section */}
          <div className="mt-6 space-y-2 text-sm opacity-90">
            <p className="font-semibold text-[#003D3B]">For any queries</p>
            <p>Email: info@fund.org</p>
            <p>Contact No: +91 9876543210</p>
          </div>
        </div>

        {/* Column 1 */}
        <div>
          <h3 className="font-semibold text-lg mb-3 text-[#003D3B]">Causes</h3>
          <ul className="space-y-2 text-sm opacity-90">
            <li className="hover:text-[#00AEEF] transition">Medical</li>
            <li className="hover:text-[#00AEEF] transition">Education</li>
            <li className="hover:text-[#00AEEF] transition">Sports</li>
            <li className="hover:text-[#00AEEF] transition">Child Welfare</li>
          </ul>
        </div>

        {/* Column 2 */}
        <div>
          <h3 className="font-semibold text-lg mb-3 text-[#003D3B]">How it works?</h3>
          <ul className="space-y-2 text-sm opacity-90">
            <li className="hover:text-[#00AEEF] transition">Fundraising for NGOs</li>
            <li className="hover:text-[#00AEEF] transition">Fundraising Tips</li>
            <li className="hover:text-[#00AEEF] transition">Withdraw Funds</li>
            <li className="hover:text-[#00AEEF] transition">Browse Fundraisers</li>
          </ul>
        </div>

        {/* Column 3 */}
        <div>
          <h3 className="font-semibold text-lg mb-3 text-[#003D3B]">Support</h3>
          <ul className="space-y-2 text-sm opacity-90">
            <li className="hover:text-[#00AEEF] transition">FAQs</li>
            <li className="hover:text-[#00AEEF] transition">Help Center</li>
            <li className="hover:text-[#00AEEF] transition">Trust & Safety</li>
            <li className="hover:text-[#00AEEF] transition">Contact Us</li>
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div className="text-center mt-10 text-sm opacity-80 border-t border-[#003D3B]/20 pt-6">
        © {new Date().getFullYear()} FundAid — Empowering Hope
      </div>
    </footer>
  );
}
