import React from "react";

const PrivacyPolicy = () => {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <p className="mb-6">
        Welcome to <strong>AI Girl Chat </strong>. Your privacy is important to us. This Privacy Policy describes how we collect, use, and protect your data when you interact with our website and our AI-based virtual chat bot services.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-3">What We Collect</h2>
      <p className="mb-6">
        We collect the following minimal user data to provide a personalized chat experience:
        <ul className="list-disc list-inside mt-2">
          <li><strong>Username</strong> – to identify you in the chat experience</li>
          <li><strong>Email Address</strong> – for login, verification, and important updates</li>
          <li><strong>Telegram ID</strong> – to connect you with the AI chat bot on Telegram</li>
        </ul>
        We do not collect any sensitive or financial information directly.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-3">How We Use Your Data</h2>
      <p className="mb-6">
        We use your data solely to:
        <ul className="list-disc list-inside mt-2">
          <li>Register and authenticate your account</li>
          <li>Connect you to your personal AI chat bot</li>
          <li>Send you updates or respond to your queries</li>
          <li>Process secure payments via Razorpay (if applicable)</li>
        </ul>
        We do not sell or share your personal data with advertisers or third parties without consent.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-3">AI Chat Interaction</h2>
      <p className="mb-6">
        Our platform allows personal interaction with an AI bot. While we strive to maintain privacy, some conversations may be logged for quality improvement or moderation in case of abuse or misuse.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-3">Payment Security</h2>
      <p className="mb-6">
        All payment transactions are securely handled through <strong>Razorpay</strong>. We do not store your payment information (card or UPI details) on our servers. Razorpay is PCI-DSS compliant and handles sensitive data securely.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-3">Data Protection</h2>
      <p className="mb-6">
        We use SSL encryption, secure servers, and limited access protocols to protect your data. Your Telegram ID is used strictly for bot connection and is not exposed publicly.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-3">Your Rights</h2>
      <p className="mb-6">
        You have the right to:
        <ul className="list-disc list-inside mt-2">
          <li>Access or update your information</li>
          <li>Request data deletion or account deactivation</li>
          <li>Withdraw consent at any time</li>
        </ul>
        Please email us to process any such requests.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-3">Grievance Redressal</h2>
      <p className="mb-6">
        If you have any concerns regarding your data, please contact:
        <br />
      
        <strong>Email:</strong> aigirl54329@gmail.com <br />
        <strong>Phone:</strong> +91-8109315778 <br />
        <strong>Address:</strong> Ganesh Nagar, Khandwa Naka, Indore, MP, India
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-3">Updates to This Policy</h2>
      <p className="mb-6">
        This Privacy Policy may be revised periodically. Any changes will be posted on this page with the updated date.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-3">Contact Us</h2>
      <p>
        Questions or concerns? Email us at <strong>aigirlchat54329@gmail.com</strong>.
      </p>
    </div>
  );
};

export default PrivacyPolicy;
