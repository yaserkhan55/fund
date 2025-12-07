import { Routes, Route, Navigate } from "react-router-dom";

// Clerk
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { SafeSignIn, SafeSignUp } from "./components/ClerkAuthWrapper";

// Layout
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ErrorBoundary from "./components/ErrorBoundary";

// Pages
import Home from "./pages/Home";
import CreateCampaign from "./pages/CreateCampaign";
import EditCampaign from "./pages/EditCampaign";
import CampaignDetails from "./pages/CampaignDetails";
import CategoryPage from "./pages/CategoryPage";   // ✅ ADDED
import BrowseFundraisers from "./pages/BrowseFundraisers";   // ✅ ADDED
import Resources from "./pages/Resources";   // ✅ ADDED
import Impact from "./pages/Impact";   // ✅ ADDED
import CreatorDashboard from "./pages/CreatorDashboard";
import WhatsAppTestPage from "./pages/WhatsAppTestPage";

// Donor Pages (Optional - for future use)
// import DonorDashboard from "./pages/DonorDashboard";

// Auth
import LoginSuccess from "./components/LoginSuccess";

// Admin
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

// Policy Pages (Razorpay Verification)
import ShippingPolicy from "./pages/ShippingPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import RefundPolicy from "./pages/RefundPolicy";
import PrivacyPolicy from "./pages/PrivacyPolicy";

function Layout({ children }) {
  return (
    <div className="overflow-x-hidden">
      <Navbar />
      <main className="pt-20 overflow-x-hidden">{children}</main>
      <Footer />
    </div>
  );
}

function ClerkProtectedRoute({ children }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
      {/* ADMIN */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />

      {/* HOME */}
      <Route
        path="/"
        element={
          <Layout>
            <Home />
          </Layout>
        }
      />

      {/* SIGN IN */}
      <Route
        path="/sign-in"
        element={
          <Layout>
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
              <div className="w-full max-w-md">
                <SafeSignIn
                  path="/sign-in"
                  routing="path"
                  afterSignInUrl="/auth/google/success"
                  redirectUrl="/auth/google/success"
                  signInFallbackRedirectUrl="/auth/google/success"
                  // Mobile-specific settings
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "w-full shadow-lg",
                    },
                  }}
                />
              </div>
            </div>
          </Layout>
        }
      />

      {/* SIGN UP */}
      <Route
        path="/sign-up"
        element={
          <Layout>
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
              <div className="w-full max-w-md">
                {/* Show message if redirected from donation */}
                {(() => {
                  const message = localStorage.getItem("donationAuthMessage");
                  if (message) {
                    localStorage.removeItem("donationAuthMessage");
                    return (
                      <div className="mb-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                        <p className="text-blue-800 font-semibold text-sm">{message}</p>
                      </div>
                    );
                  }
                  return null;
                })()}
                <SafeSignUp
                  path="/sign-up"
                  routing="path"
                  afterSignUpUrl="/auth/google/success"
                  redirectUrl="/auth/google/success"
                  signUpFallbackRedirectUrl="/auth/google/success"
                  forceRedirectUrl="/auth/google/success"
                  // Auto sign-in after sign-up - no separate login needed
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "w-full shadow-lg",
                    },
                  }}
                />
              </div>
            </div>
          </Layout>
        }
      />

      {/* AUTH SUCCESS (Clerk redirect) */}
      <Route
        path="/auth/google/success"
        element={<LoginSuccess />}
      />

      {/* DONOR ROUTES REMOVED - Guest donations don't require authentication */}

      {/* BROWSE FUNDRAISERS — ✅ ADDED */}
      <Route
        path="/browse"
        element={
          <Layout>
            <BrowseFundraisers />
          </Layout>
        }
      />

      {/* CATEGORY PAGE — ✅ ADDED */}
      <Route
        path="/category/:category"
        element={
          <Layout>
            <CategoryPage />
          </Layout>
        }
      />

      {/* RESOURCES PAGE — ✅ ADDED */}
      <Route
        path="/resources"
        element={
          <Layout>
            <Resources />
          </Layout>
        }
      />

      {/* IMPACT PAGE — ✅ ADDED */}
      <Route
        path="/impact"
        element={
          <Layout>
            <Impact />
          </Layout>
        }
      />

      {/* WHATSAPP TEST PAGE */}
      <Route
        path="/whatsapp-test"
        element={
          <Layout>
            <WhatsAppTestPage />
          </Layout>
        }
      />

      {/* CAMPAIGN DETAILS */}
      <Route
        path="/campaign/:id"
        element={
          <Layout>
            <CampaignDetails />
          </Layout>
        }
      />

      {/* PROTECTED ROUTES */}
      <Route
        path="/create-campaign"
        element={
          <Layout>
            <ClerkProtectedRoute>
              <CreateCampaign />
            </ClerkProtectedRoute>
          </Layout>
        }
      />

      <Route
        path="/edit-campaign/:id"
        element={
          <Layout>
            <ClerkProtectedRoute>
              <EditCampaign />
            </ClerkProtectedRoute>
          </Layout>
        }
      />

      <Route
        path="/dashboard"
        element={
          <Layout>
            <ClerkProtectedRoute>
              <CreatorDashboard />
            </ClerkProtectedRoute>
          </Layout>
        }
      />

      {/* POLICY PAGES (Razorpay Verification) */}
      <Route
        path="/shipping-policy"
        element={
          <Layout>
            <ShippingPolicy />
          </Layout>
        }
      />
      <Route
        path="/terms-and-conditions"
        element={
          <Layout>
            <TermsAndConditions />
          </Layout>
        }
      />
      <Route
        path="/refund-policy"
        element={
          <Layout>
            <RefundPolicy />
          </Layout>
        }
      />
      <Route
        path="/privacy-policy"
        element={
          <Layout>
            <PrivacyPolicy />
          </Layout>
        }
      />

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </ErrorBoundary>
  );
}
