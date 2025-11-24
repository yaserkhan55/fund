export default function Footer() {
  return (
    <footer className="bg-[#002F2D] text-white py-12 px-6 mt-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">

        {/* LOGO + FOLLOW */}
        <div>
          <div className="flex items-center gap-2">
            {/* Replace this with your own image */}
            <img
              src="/WhatsApp Image 2025-11-20 at 12.07.54 PM.jpeg" 
              alt="Logo"
              className="w-10 h-10 object-contain"
            />
            <h1 className="text-3xl font-bold tracking-wide">
              SEUMP<span className="text-teal-300"></span>
            </h1>
          </div>

          <div className="h-[1px] bg-white/20 my-4 w-32"></div>

          <div className="flex space-x-3">
            <div className="w-8 h-8 rounded-full bg-white/20"></div>
            <div className="w-8 h-8 rounded-full bg-white/20"></div>
            <div className="w-8 h-8 rounded-full bg-white/20"></div>
            <div className="w-8 h-8 rounded-full bg-white/20"></div>
            <div className="w-8 h-8 rounded-full bg-white/20"></div>
          </div>

          <p className="mt-4 font-semibold text-lg">2.5M +</p>
          <p className="text-sm opacity-80">Followers</p>

          <div className="mt-6 space-y-2 text-sm opacity-90">
            <p className="font-semibold">For any queries</p>
            <p>Email: info@fund.org</p>
            <p>Contact No: +91 9876543210</p>
          </div>
        </div>

        {/* Column 1 */}
        <div>
          <h3 className="font-semibold text-lg mb-3">Causes</h3>
          <ul className="space-y-2 text-sm opacity-90">
            <li>Medical</li>
            <li>Education</li>
            <li>Sports</li>
            <li>Child Welfare</li>
          </ul>
        </div>

        {/* Column 2 */}
        <div>
          <h3 className="font-semibold text-lg mb-3">How it Works?</h3>
          <ul className="space-y-2 text-sm opacity-90">
            <li>Fundraising for NGOs</li>
            <li>Fundraising Tips</li>
            <li>Withdraw Funds</li>
            <li>Browse Fundraisers</li>
          </ul>
        </div>

        {/* Column 3 */}
        <div>
          <h3 className="font-semibold text-lg mb-3">Support</h3>
          <ul className="space-y-2 text-sm opacity-90">
            <li>FAQs</li>
            <li>Help Center</li>
            <li>Trust & Safety</li>
            <li>Contact Us</li>
          </ul>
        </div>
      </div>

      {/* COPYRIGHT */}
      <div className="text-center mt-10 text-sm opacity-80 border-t border-white/20 pt-6">
        © {new Date().getFullYear()} FundAid — Empowering Hope
      </div>
    </footer>
  );
}
