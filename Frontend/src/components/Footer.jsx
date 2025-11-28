import ContactForm from "./ContactForm";

export default function Footer() {
  return (
    <footer className="bg-[#E6F8F8] text-[#004445] py-12 px-6 mt-16 border-t-2 border-teal-300">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">

        {/* LOGO + FOLLOW */}
        <div>
          <div className="flex items-center gap-3">
            <img
              src="/WhatsApp Image 2025-11-20 at 12.07.54 PM.jpeg"
              alt="Logo"
              className="w-14 h-14 rounded-full border-4 border-teal-400 object-cover shadow-md"
            />

            <h1 className="text-3xl font-extrabold tracking-wide text-[#004445]">
              SEUMP
            </h1>
          </div>

          <div className="h-[1px] bg-[#004445]/20 my-4 w-32"></div>

          <div className="flex space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#004445]/10"></div>
            <div className="w-8 h-8 rounded-full bg-[#004445]/10"></div>
            <div className="w-8 h-8 rounded-full bg-[#004445]/10"></div>
            <div className="w-8 h-8 rounded-full bg-[#004445]/10"></div>
            <div className="w-8 h-8 rounded-full bg-[#004445]/10"></div>
          </div>

          <p className="mt-4 font-semibold text-lg text-[#004445]">2.5M +</p>
          <p className="text-sm opacity-70">Followers</p>

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

        {/* Column 3 - Contact Form */}
        <div>
          <h3 className="font-semibold text-lg mb-3">Contact Us</h3>
          <ContactForm compact={true} />
        </div>
      </div>

      {/* COPYRIGHT */}
      <div className="text-center mt-10 text-sm opacity-70 border-t border-[#004445]/20 pt-6">
        © {new Date().getFullYear()} SEUMP — Empowering Hope
      </div>
    </footer>
  );
}
