// src/components/Navbar.jsx
import { Link } from "react-router-dom";
import { useContext, useState, useEffect, useRef } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const [dropdownOpen, setDropdownOpen] = useState(false); // For desktop user dropdown
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false); // For mobile profile dropdown
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // For mobile hamburger menu
  const dropdownRef = useRef();
  const mobileDropdownRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(e.target)) {
        setMobileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Shared auth menu items (same for mobile and desktop)
  const getAuthMenuItems = () => {
    if (!user) return [];
    return [
      { to: "/profile", label: "My Fundraisers" },
      { to: "/create-campaign", label: "Start a Fundraiser" },
      { label: "Logout", action: logout, isButton: true },
    ];
  };

  const authMenuItems = getAuthMenuItems();

  return (
    <nav className="w-full bg-white border-b border-gray-200 shadow-sm fixed top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo - Left */}
        <Link to="/" className="flex items-center space-x-3">
          <div className="w-16 h-16 flex items-center justify-center rounded-full bg-white border-2 border-[#00B5B8] overflow-hidden shadow-sm">
            <img 
              src="/WhatsApp Image 2025-11-20 at 12.07.54 PM.jpeg" 
              alt="SEUMP Welfare & Charitable Trust Logo" 
              className="w-full h-full object-contain p-1.5"
            />
          </div>
          <span className="text-xl md:text-2xl font-bold text-[#003d3b] tracking-wide">SEUMP</span>
        </Link>

        {/* Desktop Menu - Middle */}
        <div className="hidden md:flex items-center space-x-6 text-gray-700 font-medium">
          <Link to="/browse" className="hover:text-[#00B5B8] transition">Browse Fundraisers</Link>

          <div className="relative group">
            <span className="hover:text-[#00B5B8] transition cursor-pointer">Fundraise For ▾</span>
            <div className="absolute hidden group-hover:block bg-white shadow-lg border rounded-md mt-2 w-44 py-2 z-50">
              <Link className="block px-4 py-2 hover:bg-gray-100" to="/medical">Medical</Link>
              <Link className="block px-4 py-2 hover:bg-gray-100" to="/education">Education</Link>
              <Link className="block px-4 py-2 hover:bg-gray-100" to="/disaster">Emergencies</Link>
            </div>
          </div>

          <Link to="/how-it-works" className="hover:text-[#00B5B8] transition">How It Works</Link>
        </div>

        {/* Right side - Desktop */}
        <div className="hidden md:flex items-center space-x-4">
          <Link to="/create-campaign" className="border border-[#00B5B8] text-[#00B5B8] px-3 py-1.5 rounded-xl font-semibold hover:bg-[#E6F7F7] transition">
            Start a Fundraiser
          </Link>

          {!user ? (
            <>
              <Link to="/login" className="text-[#003d3b] font-medium hover:text-[#00B5B8]">Login</Link>
              <Link to="/register" className="bg-[#00B5B8] text-white px-3 py-1.5 rounded-md font-semibold hover:bg-[#009f9f]">Sign Up</Link>
            </>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-3 px-3 py-1 rounded-full hover:shadow transition">
                <div className="w-9 h-9 bg-gray-100 border border-gray-300 rounded-full flex items-center justify-center text-[#003d3b]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 1115 0v.75H4.5v-.75z" />
                  </svg>
                </div>

                <div className="hidden lg:block text-left">
                  <div className="text-sm font-medium text-[#003d3b]">Hi, {user?.name?.split(" ")?.[0] || "User"}</div>
                  <div className="text-xs text-gray-500">View account</div>
                </div>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-white border shadow-lg rounded-md py-2 z-50">
                  {authMenuItems.map((item, idx) => {
                    if (item.isButton) {
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setDropdownOpen(false);
                            item.action();
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                        >
                          {item.label}
                        </button>
                      );
                    }
                    return (
                      <Link
                        key={idx}
                        to={item.to}
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile - Right side (Profile icon + Hamburger) */}
        <div className="md:hidden flex items-center space-x-2">
          {/* Profile Icon - Same as desktop, always visible when logged in */}
          {user && (
            <div className="relative" ref={mobileDropdownRef}>
              <button onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)} className="flex items-center gap-2 px-2 py-1 rounded-full hover:shadow transition">
                <div className="w-9 h-9 bg-gray-100 border border-gray-300 rounded-full flex items-center justify-center text-[#003d3b]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 1115 0v.75H4.5v-.75z" />
                  </svg>
                </div>
              </button>

              {mobileDropdownOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-white border shadow-lg rounded-md py-2 z-50">
                  {authMenuItems.map((item, idx) => {
                    if (item.isButton) {
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setMobileDropdownOpen(false);
                            item.action();
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                        >
                          {item.label}
                        </button>
                      );
                    }
                    return (
                      <Link
                        key={idx}
                        to={item.to}
                        onClick={() => setMobileDropdownOpen(false)}
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Mobile Hamburger - Only for navigation links */}
          <button className="ml-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            {mobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown (navigation menu only - no auth items) */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t shadow-lg">
          <div className="px-4 py-3 space-y-2">
            <Link to="/browse" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-700 hover:text-[#00B5B8] transition">Browse Fundraisers</Link>
            <Link to="/medical" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-700 hover:text-[#00B5B8] transition">Medical</Link>
            <Link to="/education" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-700 hover:text-[#00B5B8] transition">Education</Link>
            <Link to="/disaster" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-700 hover:text-[#00B5B8] transition">Emergencies</Link>
            <Link to="/how-it-works" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-700 hover:text-[#00B5B8] transition">How It Works</Link>

            {/* Auth items only shown when NOT logged in (logged in users use profile dropdown) */}
            {!user && (
              <div className="pt-2 border-t flex flex-col gap-2">
                <Link to="/create-campaign" onClick={() => setMobileMenuOpen(false)} className="w-full text-center px-3 py-2 border border-[#00B5B8] rounded-md text-[#00B5B8] font-semibold hover:bg-[#E6F7F7] transition">Start a Fundraiser</Link>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block text-center py-2 text-[#003d3b] hover:text-[#00B5B8] transition">Login</Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block text-center py-2 bg-[#00B5B8] text-white rounded-md hover:bg-[#009f9f] transition">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
