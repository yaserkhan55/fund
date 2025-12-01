import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { FaBell } from "react-icons/fa";
import { FiGrid } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

export default function Navbar() {
  const { isSignedIn, getToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [isDonorLoggedIn, setIsDonorLoggedIn] = useState(false);

  const menuRef = useRef(null);
  const notificationRef = useRef(null);

  // Check if donor is logged in and listen for changes
  useEffect(() => {
    const checkDonorLogin = () => {
      const donorToken = localStorage.getItem("donorToken");
      const nowLoggedIn = !!donorToken;
      if (isDonorLoggedIn !== nowLoggedIn) {
        setIsDonorLoggedIn(nowLoggedIn);
      }
    };

    // Check on mount
    checkDonorLogin();

    // Listen for storage changes (when donor logs in/out in another tab)
    window.addEventListener("storage", checkDonorLogin);
    
    // Listen for custom event when donor logs in
    const handleDonorLogin = () => {
      const donorToken = localStorage.getItem("donorToken");
      setIsDonorLoggedIn(!!donorToken);
    };
    window.addEventListener("donorLogin", handleDonorLogin);
    window.addEventListener("donorLogout", handleDonorLogin);

    // Check periodically (for same-tab login) - more frequent
    const interval = setInterval(() => {
      const donorToken = localStorage.getItem("donorToken");
      setIsDonorLoggedIn(!!donorToken);
    }, 200);

    return () => {
      window.removeEventListener("storage", checkDonorLogin);
      window.removeEventListener("donorLogin", handleDonorLogin);
      window.removeEventListener("donorLogout", handleDonorLogin);
      clearInterval(interval);
    };
  }, [isDonorLoggedIn]);

  // Sync Clerk user with donor backend if signed in but no donorToken
  useEffect(() => {
    const syncClerkAsDonor = async () => {
      if (isSignedIn && !isDonorLoggedIn) {
        try {
          const { user } = await import("@clerk/clerk-react").then(m => m.useAuth());
          // This will be handled by LoginSuccess component
          // Just check if we should sync
          const shouldSync = sessionStorage.getItem("donorFlow") === "true";
          if (shouldSync) {
            // LoginSuccess will handle the sync
            return;
          }
        } catch (error) {
          console.error("Clerk sync check error:", error);
        }
      }
    };
    syncClerkAsDonor();
  }, [isSignedIn, isDonorLoggedIn]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (!isSignedIn) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    let isMounted = true;

    const fetchNotifications = async () => {
      if (!isMounted) return;
      
      try {
        if (isMounted) setLoadingNotifications(true);
        let token = null;
        try {
          token = await getToken();
        } catch (e) {
          token = localStorage.getItem("token");
        }

        if (!token || !isMounted) return;

        const res = await axios.get(`${API_URL}/api/campaigns/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (isMounted && res.data.success) {
          setNotifications(res.data.notifications || []);
          setUnreadCount(res.data.unreadCount || 0);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        if (isMounted) {
          setLoadingNotifications(false);
        }
      }
    };

    fetchNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(() => {
      if (isMounted) {
        fetchNotifications();
      }
    }, 30000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]); // Only depend on isSignedIn, not getToken

  const handleNotificationsToggle = async () => {
    const willOpen = !notificationsOpen;
    setNotificationsOpen(willOpen);

    // When opening and there are unread notifications, mark them as viewed
    if (willOpen && unreadCount > 0) {
      try {
        let token = null;
        try {
          token = await getToken();
        } catch (e) {
          token = localStorage.getItem("token");
        }

        if (!token) return;

        await axios.put(
          `${API_URL}/api/campaigns/notifications/mark-read`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Optimistically update UI
        setUnreadCount(0);
        setNotifications((prev) =>
          prev.map((n) => ({
            ...n,
            viewed: true,
          }))
        );
      } catch (error) {
        console.error("Error marking notifications as read:", error);
      }
    }
  };

  return (
    <nav className="w-full bg-white border-b border-gray-200 shadow-sm fixed top-0 left-0 right-0 z-50 overflow-visible">
      <div className="max-w-7xl mx-auto h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 relative">

        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0 min-w-0">
          <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-full bg-white border-2 border-[#00B5B8] overflow-hidden shadow-sm flex-shrink-0">
            <img
              src="/WhatsApp Image 2025-11-20 at 12.07.54 PM.jpeg"
              className="w-full h-full object-contain p-1.5"
            />
          </div>
          <span className="text-lg sm:text-xl md:text-2xl font-bold text-[#003d3b] tracking-wide truncate">
            SEUMP
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center space-x-4 xl:space-x-6 text-gray-700 font-medium flex-shrink-0">
          <Link to="/browse" className="hover:text-[#00B5B8]">Browse Fundraisers</Link>

          {/* FIXED DROPDOWN (click-to-open) */}
          <div className="relative" ref={menuRef}>
            <span
              className="hover:text-[#00B5B8] cursor-pointer"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              Fundraise For ▾
            </span>

            {menuOpen && (
              <div className="absolute bg-white shadow-lg border rounded-md mt-2 w-44 py-2 z-50">
                <Link className="block px-4 py-2 hover:bg-gray-100" to="/category/medical">
                  Medical
                </Link>
                <Link className="block px-4 py-2 hover:bg-gray-100" to="/category/education">
                  Education
                </Link>
                <Link className="block px-4 py-2 hover:bg-gray-100" to="/category/emergency">
                  Emergencies
                </Link>
              </div>
            )}
          </div>

          <Link to="/how-it-works" className="hover:text-[#00B5B8]">
            How It Works
          </Link>
        </div>

        {/* Desktop Right Side */}
        <div className="hidden md:flex items-center space-x-2 lg:space-x-4 flex-shrink-0">
          <Link
            to="/create-campaign"
            className="border border-[#00B5B8] text-[#00B5B8] px-2 lg:px-3 py-1.5 rounded-xl font-semibold hover:bg-[#E6F7F7] text-sm lg:text-base whitespace-nowrap"
          >
            Start a Fundraiser
          </Link>

          <SignedOut>
            {/* Campaign Creator Login/Signup */}
            <Link
              to="/sign-in"
              className="border border-[#00B5B8] text-[#00B5B8] px-2 lg:px-3 py-1.5 rounded-xl font-semibold hover:bg-[#E6F7F7] text-sm lg:text-base whitespace-nowrap"
            >
              Create Campaign
            </Link>
          </SignedOut>

          <SignedIn>
            {/* Show Donor Dashboard if donor is logged in */}
            {isDonorLoggedIn && (
              <Link
                to="/donor/dashboard"
                className="bg-[#00B5B8] text-white px-2 lg:px-3 py-1.5 rounded-xl font-semibold hover:bg-[#009f9f] text-sm lg:text-base whitespace-nowrap mr-2"
              >
                Donor Dashboard
              </Link>
            )}
            {/* Dashboard Icon */}
            <Link
              to="/dashboard"
              className="relative p-2 text-gray-700 hover:text-[#00B5B8] transition-colors rounded-lg hover:bg-[#E6F7F7] flex-shrink-0"
              aria-label="Dashboard"
              title="My Dashboard"
            >
              <FiGrid className="w-5 h-5 lg:w-6 lg:h-6" />
            </Link>
            {/* Notifications Bell */}
            <div className="relative flex-shrink-0 z-[100]" ref={notificationRef}>
              <button
                onClick={handleNotificationsToggle}
                className="relative p-2 text-gray-700 hover:text-[#00B5B8] transition-colors"
                aria-label="Notifications"
              >
                <FaBell className="text-lg lg:text-xl" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto" style={{ zIndex: 9999 }}>
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-[#003d3b]">Notifications</h3>
                    {unreadCount > 0 && (
                      <p className="text-xs text-gray-500 mt-1">{unreadCount} unread</p>
                    )}
                  </div>
                  {loadingNotifications ? (
                    <div className="p-4 text-center text-gray-500">Loading...</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No notifications</div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {notifications.map((notif) => {
                        const NotificationContent = (
                          <div className={`flex items-start gap-3 ${
                            !notif.viewed ? "bg-blue-50" : ""
                          }`}>
                            <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                              !notif.viewed ? "bg-[#00B5B8]" : "bg-gray-300"
                            }`}></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-[#00B5B8] uppercase tracking-wide mb-1">
                                {notif.type === "contact_reply" ? "Admin Reply" :
                                 notif.type === "info_request" ? "Info Request" :
                                 notif.type === "admin_action" ? "Campaign Update" : "Notification"}
                              </p>
                              {notif.campaignTitle && (
                                <p className="text-sm font-semibold text-[#003d3b] line-clamp-1">
                                  {notif.campaignTitle}
                                </p>
                              )}
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {notif.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                {new Date(notif.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        );

                        if (notif.type === "contact_reply") {
                          return (
                            <div
                              key={notif.id}
                              onClick={() => setNotificationsOpen(false)}
                              className="block p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              {NotificationContent}
                            </div>
                          );
                        }

                        return (
                          <Link
                            key={notif.id}
                            to={notif.campaignId ? `/campaign/${notif.campaignId}` : "#"}
                            onClick={() => setNotificationsOpen(false)}
                            className={`block p-4 hover:bg-gray-50 transition-colors ${
                              !notif.viewed ? "bg-blue-50" : ""
                            }`}
                          >
                            {NotificationContent}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex-shrink-0">
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
        </div>

        {/* Mobile Right Area */}
        <div className="md:hidden flex items-center gap-2 flex-shrink-0">
          <SignedIn>
            {/* Mobile Dashboard Icon */}
            <Link
              to="/dashboard"
              className="relative p-2 text-gray-700 hover:text-[#00B5B8] transition-colors rounded-lg hover:bg-[#E6F7F7]"
              aria-label="Dashboard"
              title="My Dashboard"
            >
              <FiGrid className="w-6 h-6" />
            </Link>
            {/* Mobile Notifications Bell */}
            <div className="relative z-50" ref={notificationRef}>
              <button
                onClick={handleNotificationsToggle}
                className="relative p-2 text-gray-700 hover:text-[#00B5B8] transition-colors"
                aria-label="Notifications"
              >
                <FaBell className="text-xl" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Mobile Notifications Dropdown */}
              {notificationsOpen && (
                <div className="fixed md:absolute right-4 md:right-0 left-4 md:left-auto top-20 md:top-auto mt-0 md:mt-2 w-auto md:w-80 min-w-[280px] max-w-[calc(100vw-2rem)] md:max-w-none bg-white rounded-lg shadow-xl border border-gray-200 z-[60] max-h-[calc(100vh-6rem)] md:max-h-96 overflow-y-auto">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-[#003d3b]">Notifications</h3>
                    {unreadCount > 0 && (
                      <p className="text-xs text-gray-500 mt-1">{unreadCount} unread</p>
                    )}
                  </div>
                  {loadingNotifications ? (
                    <div className="p-4 text-center text-gray-500">Loading...</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No notifications</div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {notifications.map((notif) => (
                        <Link
                          key={notif.id}
                          to={`/campaign/${notif.campaignId}`}
                          onClick={() => setNotificationsOpen(false)}
                          className={`block p-4 hover:bg-gray-50 transition-colors ${
                            !notif.viewed ? "bg-blue-50" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                              !notif.viewed ? "bg-[#00B5B8]" : "bg-gray-300"
                            }`}></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-[#003d3b] line-clamp-1">
                                {notif.campaignTitle}
                              </p>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {notif.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                {new Date(notif.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
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

          <div className="flex flex-col space-y-2">
            <Link 
              to="/category/medical" 
              onClick={() => setOpen(false)}
              className="font-bold text-[#003d3b] shadow-sm px-3 py-2 rounded-lg bg-white/50"
            >
              Medical
            </Link>
            <Link 
              to="/category/education" 
              onClick={() => setOpen(false)}
              className="font-bold text-[#003d3b] shadow-sm px-3 py-2 rounded-lg bg-white/50"
            >
              Education
            </Link>
            <Link 
              to="/category/emergency" 
              onClick={() => setOpen(false)}
              className="font-bold text-[#003d3b] shadow-sm px-3 py-2 rounded-lg bg-white/50"
            >
              Emergencies
            </Link>
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
              Create Campaign (Login)
            </Link>
          </SignedOut>

          {/* Donor Dashboard Button - Show when logged in as donor (regardless of Clerk status) */}
          {isDonorLoggedIn && (
            <Link
              to="/donor/dashboard"
              onClick={() => setOpen(false)}
              className="block bg-gradient-to-r from-[#00B5B8] to-[#009EA1] text-white text-center py-3 rounded-xl font-semibold shadow hover:from-[#009EA1] hover:to-[#008B8E] transition"
            >
              Donor Dashboard
            </Link>
          )}

        </div>
      </div>
    </nav>
  );
}
