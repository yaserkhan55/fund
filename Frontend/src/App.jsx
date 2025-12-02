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
import CreatorDashboard from "./pages/CreatorDashboard";

// Donor Pages
import DonorRegister from "./pages/DonorRegister";
import DonorLogin from "./pages/DonorLogin";
import DonorVerifyOTP from "./pages/DonorVerifyOTP";
import DonorDashboard from "./pages/DonorDashboard";

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
                  afterSignInUrl="/"
                  redirectUrl="/"
                  signInFallbackRedirectUrl="/"
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
                <SafeSignUp
                  path="/sign-up"
                  routing="path"
                  afterSignUpUrl="/"
                  redirectUrl="/"
                  signUpFallbackRedirectUrl="/"
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

      {/* AUTH SUCCESS (Clerk redirect) */}
      <Route
        path="/auth/google/success"
        element={<LoginSuccess />}
      />

      {/* DONOR ROUTES */}
      <Route
        path="/donor/register"
        element={
          <Layout>
            <DonorRegister />
          </Layout>
        }
      />
      <Route
        path="/donor/login"
        element={
          <Layout>
            <DonorLogin />
          </Layout>
        }
      />
      <Route
        path="/donor/sign-in"
        element={
          <Layout>
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 bg-[#F1FAFA]">
              <div className="w-full max-w-md">
                <SafeSignIn
                  path="/donor/sign-in"
                  routing="path"
                  afterSignInUrl="/auth/google/success"
                  redirectUrl="/auth/google/success"
                  signInFallbackRedirectUrl="/auth/google/success"
                  // Mobile-specific settings - enable account switching
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
      <Route
        path="/donor/sign-up"
        element={
          <Layout>
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 bg-[#F1FAFA]">
              <div className="w-full max-w-md">
                <SafeSignUp
                  path="/donor/sign-up"
                  routing="path"
                  afterSignUpUrl="/auth/google/success"
                  redirectUrl="/auth/google/success"
                  signUpFallbackRedirectUrl="/auth/google/success"
                  // Mobile-specific settings - enable account switching
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
      <Route
        path="/donor/verify-otp"
        element={
          <Layout>
            <DonorVerifyOTP />
          </Layout>
        }
      />
      <Route
        path="/donor/dashboard"
        element={
          <Layout>
            <DonorDashboard />
          </Layout>
        }
      />

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
