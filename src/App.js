import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import AgeVerification from "./components/AgeVerification";
import PaymentPage from "./pages/PaymentPage"; // ✅ add your payment page
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
// import Chat from "./pages/Chat";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import RefundPolicy from "./pages/RefundPolicy";
import BotPage from "./pages/BotPage";
import ContactUs from "./pages/ContactUs";

// ✅ Enhanced PrivateRoute to include both verifications
const PrivateRoute = ({ children }) => {
  const isVerified = localStorage.getItem("ageVerified") === "true";
  const isPaid = localStorage.getItem("isPaid") === "true";
  return isVerified && isPaid ? children : <Navigate to="/payment" replace />;
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/age-verification" element={<AgeVerification />} />
        <Route path="/payment" element={<PaymentPage />} />

        {/* Protected Routes (require age verification + payment) */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PrivateRoute>
              <Login />
            </PrivateRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PrivateRoute>
              <Signup />
            </PrivateRoute>
          }
        />
        {/* <Route
          path="/chat"
          element={
            <PrivateRoute>
              <Chat />
            </PrivateRoute>
          }
        /> */}
        <Route
          path="/privacy"
          element={
            <PrivateRoute>
              <PrivacyPolicy />
            </PrivateRoute>
          }
        />
        <Route
          path="/terms"
          element={
            <PrivateRoute>
              <TermsAndConditions />
            </PrivateRoute>
          }
        />
        <Route
          path="/refund"
          element={
            <PrivateRoute>
              <RefundPolicy />
            </PrivateRoute>
          }
        />
        <Route
          path="/contact"
          element={
            <PrivateRoute>
              <ContactUs />
            </PrivateRoute>
          }
        />
        <Route
          path="/bot"
          element={
            <PrivateRoute>
              <BotPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
