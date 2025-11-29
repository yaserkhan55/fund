import { Routes, Route, Navigate } from "react-router-dom";

// Clerk
import { SignedIn, SignedOut, RedirectToSignIn, SignIn, SignUp } from "@clerk/clerk-react";

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

// Admin
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

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
            <SignIn
              path="/sign-in"
              routing="path"
              afterSignInUrl="/"
              redirectUrl="/"
            />
          </Layout>
        }
      />

      {/* SIGN UP */}
      <Route
        path="/sign-up"
        element={
          <Layout>
            <SignUp
              path="/sign-up"
              routing="path"
              afterSignUpUrl="/"
              redirectUrl="/"
            />
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

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </ErrorBoundary>
  );
}
