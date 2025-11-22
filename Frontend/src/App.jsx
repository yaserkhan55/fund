  import { Routes, Route } from "react-router-dom";

  // Layout
  import Navbar from "./components/Navbar";
  import Footer from "./components/Footer";
  import ProtectedRoute from "./components/ProtectedRoute";

  // User Pages
  import Home from "./pages/Home";
  import Login from "./pages/Login";
  import Register from "./pages/Register";
  import CreateCampaign from "./pages/CreateCampaign";
  import CampaignDetails from "./pages/CampaignDetails";
  import Profile from "./pages/Profile";

  // OTP Login Pages
  import LoginWithPhone from "./pages/LoginWithPhone";
  import VerifyOtp from "./pages/VerifyOtp";
  import LoginWithEmailOtp from "./pages/LoginWithEmailOtp";
  import LoginSuccess from "./components/LoginSuccess";

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

  export default function App() {
    return (
      <Routes>
        {/* ===== ADMIN ROUTES (NO NAVBAR / FOOTER) ===== */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* ===== USER ROUTES WITH NAVBAR + FOOTER ===== */}
        <Route
          path="/"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />
        <Route
          path="/login"
          element={
            <Layout>
              <Login />
            </Layout>
          }
        />
        <Route
          path="/register"
          element={
            <Layout>
              <Register />
            </Layout>
          }
        />
        <Route
          path="/campaign/:id"
          element={
            <Layout>
              <CampaignDetails />
            </Layout>
          }
        />

<Route
  path="/auth/google/success"
  element={
    <Layout>
      <div className="p-6 text-center text-lg">
        Logging you in...
      </div>
    </Layout>
  }
/>

        <Route
          path="/create-campaign"
          element={
            <Layout>
              <ProtectedRoute>
                <CreateCampaign />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/profile"
          element={
            <Layout>
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/login-phone"
          element={
            <Layout>
              <LoginWithPhone />
            </Layout>
          }
        />
        <Route
          path="/verify-otp"
          element={
            <Layout>
              <VerifyOtp />
            </Layout>
          }
        />
        <Route
          path="/login-email"
          element={
            <Layout>
              <LoginWithEmailOtp />
            </Layout>
          }
        />
        <Route
          path="/login-success"
          element={
            <Layout>
              <LoginSuccess />
            </Layout>
          }
        />
      </Routes>
    );
  }
