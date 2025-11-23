import { useState } from "react";
import { Link } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="w-full bg-white border-b border-gray-200 shadow-sm fixed top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center space-x-3">
          <div className="w-16 h-16 flex items-center justify-center rounded-full bg-white border-2 border-[#00B5B8] overflow-hidden shadow-sm">
            <img 
              src="/WhatsApp Image 2025-11-20 at 12.07.54 PM.jpeg" 
              className="w-full h-full object-contain p-1.5"
            />
          </div>
          <span className="text-xl md:text-2xl font-bold text-[#003d3b] tracking-wide">
            SEUMP
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6 text-gray-700 font-medium">
          <Link to="/browse" className="hover:text-[#00B5B8]">Browse Fundraisers</Link>

          <div className="relative group">
            <span className="hover:text-[#00B5B8] cursor-pointer">Fundraise For ▾</span>
            <div className="absolute hidden group-hover:block bg-white shadow-lg border rounded-md mt-2 w-44 py-2 z-50">
              <Link className="block px-4 py-2 hover:bg-gray-100" to="/medical">Medical</Link>
              <Link className="block px-4 py-2 hover:bg-gray-100" to="/education">Education</Link>
              <Link className="block px-4 py-2 hover:bg-gray-100" to="/disaster">Emergencies</Link>
            </div>
          </div>

          <Link to="/how-it-works" className="hover:text-[#00B5B8]">How It Works</Link>
        </div>

        {/* Desktop Right Side */}
        <div className="hidden md:flex items-center space-x-4">

          <Link
            to="/create-campaign"
            className="border border-[#00B5B8] text-[#00B5B8] px-3 py-1.5 rounded-xl font-semibold hover:bg-[#E6F7F7]"
          >
            Start a Fundraiser
          </Link>

          {/* Logged OUT */}
          <SignedOut>
            <Link to="/sign-in" className="text-[#003d3b] font-medium hover:text-[#00B5B8]">
              Login
            </Link>

            <Link
              to="/sign-up"
              className="bg-[#00B5B8] text-white px-3 py-1.5 rounded-md font-semibold hover:bg-[#009f9f]"
            >
              Sign Up
            </Link>
          </SignedOut>

          {/* Logged IN */}
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>

        {/* Mobile Right Side */}
        <div className="md:hidden flex items-center gap-3">

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>

          {/* Hamburger Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden bg-white border-t border-gray-200 shadow-sm transition-all duration-300 overflow-hidden ${
          mobileOpen ? "max-h-[500px] py-4" : "max-h-0 py-0"
        }`}
      >
        <div className="px-5 flex flex-col space-y-4 text-gray-700 font-medium">

          <Link to="/browse" onClick={() => setMobileOpen(false)}>Browse Fundraisers</Link>

          <div className="flex flex-col space-y-1">
            <span className="font-semibold">Fundraise For</span>
            <Link className="ml-3" to="/medical" onClick={() => setMobileOpen(false)}>Medical</Link>
            <Link className="ml-3" to="/education" onClick={() => setMobileOpen(false)}>Education</Link>
            <Link className="ml-3" to="/disaster" onClick={() => setMobileOpen(false)}>Emergencies</Link>
          </div>

          <Link to="/how-it-works" onClick={() => setMobileOpen(false)}>
            How It Works
          </Link>

          <hr />

          {/* Logged OUT */}
          <SignedOut>
            <Link to="/sign-in" onClick={() => setMobileOpen(false)}>
              Login
            </Link>

            <Link
              to="/sign-up"
              onClick={() => setMobileOpen(false)}
              className="font-semibold text-[#00B5B8]"
            >
              Sign Up
            </Link>

            <Link
              to="/create-campaign"
              onClick={() => setMobileOpen(false)}
              className="font-semibold"
            >
              Start a Fundraiser
            </Link>
          </SignedOut>

          {/* Logged IN */}
          <SignedIn>
            <Link
              to="/create-campaign"
              onClick={() => setMobileOpen(false)}
              className="font-semibold"
            >
              Start a Fundraiser
            </Link>
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}
