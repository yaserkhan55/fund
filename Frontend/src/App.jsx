import { Routes, Route, Navigate } from "react-router-dom";

// Clerk
import { SignedIn, SignedOut, RedirectToSignIn, SignIn, SignUp } from "@clerk/clerk-react";

// Layout
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Pages
import Home from "./pages/Home";
import CreateCampaign from "./pages/CreateCampaign";
import EditCampaign from "./pages/EditCampaign";
import CampaignDetails from "./pages/CampaignDetails";
import Profile from "./pages/Profile";
import CategoryPage from "./pages/CategoryPage";   // ✅ ADDED

// Admin
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main className="pt-20">{children}</main>
      <Footer />
    </>
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
        path="/profile"
        element={
          <Layout>
            <ClerkProtectedRoute>
              <Profile />
            </ClerkProtectedRoute>
          </Layout>
        }
      />

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
