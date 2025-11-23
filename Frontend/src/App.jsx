import { Routes, Route, Navigate } from "react-router-dom";

/* Clerk */
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

/* Layout */
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

/* Pages */
import Home from "./pages/Home";
import CreateCampaign from "./pages/CreateCampaign";
import CampaignDetails from "./pages/CampaignDetails";
import Profile from "./pages/Profile";

/* Clerk Auth Pages  (your file names EXACTLY) */
import SignINButton from "./pages/SignINButton";
import SignUpButton from "./pages/SignUpButton";

/* Admin */
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

/* Layout wrapper */
function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main className="pt-20">{children}</main>
      <Footer />
    </>
  );
}

/* Clerk Protected Route Wrapper */
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
      {/* ===== ADMIN ROUTES (NO NAVBAR/FOOTER) ===== */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />

      {/* ===== PUBLIC ROUTES WITH LAYOUT ===== */}
      <Route
        path="/"
        element={
          <Layout>
            <Home />
          </Layout>
        }
      />

      {/* Clerk Sign In */}
      <Route
        path="/sign-in"
        element={
          <Layout>
            <SignINButton />
          </Layout>
        }
      />

      {/* Clerk Sign Up */}
      <Route
        path="/sign-up"
        element={
          <Layout>
            <SignUpButton />
          </Layout>
        }
      />

      {/* Campaign Details */}
      <Route
        path="/campaign/:id"
        element={
          <Layout>
            <CampaignDetails />
          </Layout>
        }
      />

      {/* ===== PROTECTED ROUTES (Clerk) ===== */}
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
        path="/profile"
        element={
          <Layout>
            <ClerkProtectedRoute>
              <Profile />
            </ClerkProtectedRoute>
          </Layout>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
