import { useState } from "react";
import { Link } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

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
            <span className="hover:text-[#00B5B8] cursor-pointer">
              Fundraise For ▾
            </span>
            <div className="absolute hidden group-hover:block bg-white shadow-lg border rounded-md mt-2 w-44 py-2 z-50">
              <Link className="block px-4 py-2 hover:bg-gray-100" to="/medical">Medical</Link>
              <Link className="block px-4 py-2 hover:bg-gray-100" to="/education">Education</Link>
              <Link className="block px-4 py-2 hover:bg-gray-100" to="/disaster">Emergencies</Link>
            </div>
          </div>

          <Link to="/how-it-works" className="hover:text-[#00B5B8]">
            How It Works
          </Link>
        </div>

        {/* Desktop Right Side */}
        <div className="hidden md:flex items-center space-x-4">
          <Link
            to="/create-campaign"
            className="border border-[#00B5B8] text-[#00B5B8] px-3 py-1.5 rounded-xl font-semibold hover:bg-[#E6F7F7]"
          >
            Start a Fundraiser
          </Link>

          <SignedOut>
            <Link
              to="/sign-in"
              className="border border-[#00B5B8] text-[#00B5B8] px-3 py-1.5 rounded-xl font-semibold hover:bg-[#E6F7F7]"
            >
              Login
            </Link>

            <Link
              to="/sign-up"
              className="bg-[#00B5B8] text-white px-3 py-1.5 rounded-xl font-semibold hover:bg-[#009f9f]"
            >
              Sign Up
            </Link>
          </SignedOut>

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>

        {/* Mobile Right Area */}
        <div className="md:hidden flex items-center gap-3">

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>

          {/* Hamburger */}
          <button onClick={() => setOpen(!open)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#003d3b]"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      <div className={`${open ? "max-h-[600px]" : "max-h-0"} overflow-hidden transition-all duration-300 bg-white shadow-lg md:hidden`}>
        <div className="p-6 space-y-5 text-[#003d3b] font-medium">

          <Link to="/browse" onClick={() => setOpen(false)} className="block text-lg">
            Browse Fundraisers
          </Link>

          <div>
            <p className="font-semibold mb-2">Fundraise For</p>
            <div className="flex flex-col space-y-2 ml-3">
              <Link to="/medical" onClick={() => setOpen(false)}>Medical</Link>
              <Link to="/education" onClick={() => setOpen(false)}>Education</Link>
              <Link to="/disaster" onClick={() => setOpen(false)}>Emergencies</Link>
            </div>
          </div>

          <Link to="/how-it-works" onClick={() => setOpen(false)} className="block text-lg">
            How It Works
          </Link>

          <Link
            to="/create-campaign"
            onClick={() => setOpen(false)}
            className="block bg-[#00B5B8] text-white text-center py-3 rounded-xl font-semibold shadow"
          >
            Start a Fundraiser
          </Link>

          <SignedOut>
            <Link
              to="/sign-in"
              onClick={() => setOpen(false)}
              className="block border border-[#00B5B8] text-[#00B5B8] text-center py-3 rounded-xl font-semibold"
            >
              Login
            </Link>

            <Link
              to="/sign-up"
              onClick={() => setOpen(false)}
              className="block bg-[#00B5B8] text-white text-center py-3 rounded-xl font-semibold shadow"
            >
              Sign Up
            </Link>
          </SignedOut>

        </div>
      </div>
    </nav>
  );
}
