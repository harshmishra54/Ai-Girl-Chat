import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import AgeVerification from "./components/AgeVerification";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import RefundPolicy from "./pages/RefundPolicy";
import BotPage from "./pages/BotPage";
import ContactUs from "./pages/ContactUs";
import PaymentPage from "./pages/PaymentPage"; // <-- import PaymentPage

// ✅ Only checks for age verification now
const PrivateRoute = ({ children }) => {
  const isVerified = localStorage.getItem("ageVerified") === "true";
  return isVerified ? children : <Navigate to="/" replace />;
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* ✅ First route is Age Verification */}
        <Route path="/" element={<AgeVerification />} />

        {/* Protected Routes - only after age verification */}
        <Route
          path="/home"
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

        {/* New Payment Page route */}
        <Route
          path="/payments"
          element={
            <PrivateRoute>
              <PaymentPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
