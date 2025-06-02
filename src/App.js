import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import AgeVerification from "./components/AgeVerification"; // Import your AgeVerification component

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
// import Chat from "./pages/Chat";
// import Header from "./components/Header";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import RefundPolicy from "./pages/RefundPolicy";
import BotPage from "./pages/BotPage";
import ContactUs from "./pages/ContactUs";

const PrivateRoute = ({ children }) => {
  const isVerified = localStorage.getItem("ageVerified") === "true";
  return isVerified ? children : <Navigate to="/age-verification" replace />;
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Age Verification Route */}
        <Route path="/age-verification" element={<AgeVerification />} />

        {/* Protected Routes */}
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
